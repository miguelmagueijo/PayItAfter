import {Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, View} from "react-native";
import {useCallback, useEffect, useState} from "react";
import {Check} from "lucide-react-native";
import {useSQLiteContext} from "expo-sqlite";
import {useFocusEffect} from "expo-router";
import {Colors} from "@/constants/theme";
import {loadAndSetYuanValue, loadServerToken} from "@/constants/helpers/db";
import {Equal, RefreshCcw, RotateCcw} from "lucide-react-native/icons";
import {API_URL, getAuthHeader} from "@/constants/helpers/api";

type LastSyncInfo = {
    timestamp: number;
    version: number;
    date: Date;
}

function SyncOptions({isLoading, isBadToken, token, serverStatus, updateStatusFn, setServerOnlineFn}: {
    isLoading: boolean,
    isBadToken: boolean,
    token: string | undefined,
    serverStatus: boolean,
    updateStatusFn: () => void,
    setServerOnlineFn: (isOnline: boolean) => void,
}) {
    const [lastSyncInfo, setLastSyncInfo] = useState<LastSyncInfo>();
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    function updateLastSyncInfo() {
        if (isRefreshing || !serverStatus || !token) {
            return;
        }

        setIsRefreshing(true);

        fetch(`${API_URL}/last-sync`, {
            method: "GET",
            headers: {
                Authorization: getAuthHeader(token),
            }
        }).then((response) => {
            if (!response.ok) {
                throw Error("No sync info available");
            }

            return response.json();
        }).then((data) => {
            setLastSyncInfo({...data, date: new Date(data.timestamp * 1000)});
        }).catch(() => {
            setServerOnlineFn(false);
        }).finally(() => {
            setTimeout(() => setIsRefreshing(false), 2000);
        });
    }

    useEffect(() => {
        updateLastSyncInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverStatus])

    if (!serverStatus || !token) {
        let buttonColor: string = Colors.primary;
        if (isLoading) {
            buttonColor = "gray";
        }

        return (
            <View style={{marginTop: 20}}>
                <Text style={{color: "red", textAlign: "center", fontSize: 18}}>
                    {isBadToken ? "Server token is not accepted" : "Couldn't connect to server!"}
                </Text>
                <Pressable
                    disabled={isLoading}
                    onPress={updateStatusFn}
                    style={({pressed}) => [{
                        backgroundColor: pressed && !isLoading ? Colors.accent : buttonColor,
                        flexDirection: "row",
                        marginTop: 10,
                        padding: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        borderRadius: 5,
                    }]}
                >
                    <RotateCcw/>
                    <Text style={{fontSize: 18, fontWeight: "bold"}}>
                        Try again
                    </Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={{marginTop: 20}}>
            {lastSyncInfo && lastSyncInfo.timestamp > 0 &&
                <Text style={{color: Colors.text, opacity: 0.5}}>
                    Sync Version is {lastSyncInfo.version} @&nbsp;
                    {lastSyncInfo.date.toLocaleDateString()}&nbsp;
                    {lastSyncInfo.date.toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </Text>}
            <Pressable
                disabled={isRefreshing}
                style={({pressed}) => [{
                    padding: 10,
                    marginTop: 10,
                    backgroundColor: isRefreshing ? "gray" : (pressed ? Colors.accent : Colors.primary),
                    borderRadius: 5,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10
                }]}
                onPress={updateLastSyncInfo}
            >
                <RefreshCcw/>
                <Text style={{fontWeight: "bold", fontSize: 16}}>
                    Refresh
                </Text>
            </Pressable>
            {/* TODO: create sync button and delete button */}
        </View>
    );
}

export default function Settings() {
    const [yuanValue, setYuanValue] = useState<string>();
    const [serverToken, setServerToken] = useState<string>();
    const [serverOnline, setServerOnline] = useState<boolean>(false);
    const [isBadToken, setIsBadToken] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [dbServerToken, setDbServerToken] = useState<string>();
    const db = useSQLiteContext();

    function handleYuanValueSave() {
        if (!yuanValue || isNaN(Number(yuanValue))) {
            ToastAndroid.show("Invalid Yuan value", ToastAndroid.SHORT);
            return;
        }

        const yuanNumber = Number(yuanValue);
        if (yuanNumber < 1) {
            ToastAndroid.show("Yuan value must be 1 or greater", ToastAndroid.SHORT);
            return;
        }

        Keyboard.dismiss();

        db.runSync("UPDATE configuration SET value = ? WHERE id = 'yuan_value'", yuanValue);
        ToastAndroid.show("Yuan value changed", ToastAndroid.SHORT);
    }

    function handleServerTokenSave() {
        if (!serverToken) {
            ToastAndroid.show("Server token cannot be empty", ToastAndroid.SHORT);
            return;
        }

        Keyboard.dismiss();

        db.runSync("UPDATE configuration SET value = ? WHERE id = 'server_token'", serverToken);
        ToastAndroid.show("Server token updated", ToastAndroid.SHORT);

        updateServerStatus();
    }

    function updateServerStatus() {
        if (isLoading) {
            return;
        }

        setIsLoading(true);

        console.log("Requesting connection update");
        const token = loadServerToken(db);
        if (!token) {
            ToastAndroid.show("Bad  token not found", ToastAndroid.SHORT);
            setIsLoading(false);
            return;
        }

        setDbServerToken(token);

        fetch(`${API_URL}/check`, {
            headers: {
                Authorization: getAuthHeader(token),
            },
            method: "GET",
        }).then(res => {
            setServerOnline(res.ok);
            setIsBadToken(res.status === 401);
        }).catch(err => {
            ToastAndroid.show(err, ToastAndroid.SHORT);
            setIsBadToken(false);
        }).finally(() => {
            setTimeout(() => setIsLoading(false), 2000);
        });
    }

    useFocusEffect(
        useCallback(() => {
            loadAndSetYuanValue(db, setYuanValue);
            loadServerToken(db, setServerToken);
            updateServerStatus();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [db])
    );

    return (
        <ScrollView style={{padding: 15}} keyboardShouldPersistTaps={"handled"}>
            <Text style={{color: "#f8eaef", fontSize: 14, fontWeight: "bold", opacity: 0.5}}>CONVERSION RATE</Text>
            <View
                style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 5
                }}>
                <View style={styles.moneyWrapper}>
                    <TextInput
                        style={{
                            flex: 1,
                            textAlign: "center",
                            fontSize: 20,
                            fontWeight: "bold",
                            color: "#f8eaef"
                        }}
                        inputMode="decimal"
                        value={"1"}
                        readOnly={true}
                    />
                    <Text style={styles.moneySymbol}>€</Text>
                </View>
                <Equal strokeWidth={4} color={Colors.text}/>
                <View style={styles.moneyWrapper}>
                    <TextInput
                        style={styles.yuanInput}
                        inputMode="decimal"
                        placeholder="0"
                        placeholderTextColor="rgba(201, 201, 201, 0.3)"
                        onChangeText={newValue => setYuanValue(newValue)}
                        value={yuanValue}
                    />
                    <Text style={styles.moneySymbol}>¥</Text>
                </View>
                <Pressable
                    style={({pressed}) => [
                        {
                            backgroundColor: pressed ? Colors.accent : Colors.brighterPrimary,
                        },
                        styles.saveButton,
                    ]}
                    onPress={handleYuanValueSave}
                >
                    <Check size={24} strokeWidth={4}/>
                </Pressable>
            </View>
            <View style={{marginTop: 20}}>
                <Text style={{color: "#f8eaef", fontSize: 14, fontWeight: "bold", opacity: 0.5}}>
                    SERVER TOKEN
                </Text>
                <View style={{flexDirection: "row", gap: 10, alignItems: "center"}}>
                    <TextInput
                        value={serverToken}
                        onChangeText={newValue => setServerToken(newValue)}
                        inputMode={"text"}
                        style={{
                            flex: 1,
                            borderWidth: 4,
                            backgroundColor: Colors.dark,
                            padding: 10,
                            borderColor: Colors.brightBackground,
                            color: Colors.text,
                            fontSize: 18,
                            borderRadius: 5
                        }}/>
                    <Pressable
                        style={({pressed}) => [
                            {
                                backgroundColor: pressed ? Colors.accent : Colors.brighterPrimary,
                                justifyContent: "center",
                                alignItems: "center",
                                borderRadius: 5,
                                width: 55,
                                padding: 10,
                                borderWidth: 4,
                                borderColor: "transparent"
                            },
                        ]}
                        onPress={handleServerTokenSave}
                    >
                        <Check strokeWidth={4}/>
                    </Pressable>
                </View>
            </View>
            <SyncOptions isLoading={isLoading} isBadToken={isBadToken} token={dbServerToken} serverStatus={serverOnline}
                         setServerOnlineFn={setServerOnline} updateStatusFn={updateServerStatus}/>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    moneySymbol: {
        display: "flex",
        color: Colors.text,
        fontSize: 20,
        fontWeight: "bold",
        paddingHorizontal: 15,
    },
    yuanInput: {
        flex: 1,
        textAlign: "center",
        fontSize: 20,
        fontWeight: "bold",
        backgroundColor: Colors.dark,
        color: Colors.text
    },
    moneyWrapper: {
        flex: 1,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 4,
        borderRadius: 5,
        borderColor: Colors.brightBackground,
        backgroundColor: Colors.brightBackground,
        height: 55
    },
    saveButton: {
        justifyContent: "center",
        alignItems: "center",
        height: 55,
        borderRadius: 5,
        padding: 15,
    }
})