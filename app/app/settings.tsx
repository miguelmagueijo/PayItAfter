import {Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, View} from "react-native";
import {useState} from "react";
import {Check} from "lucide-react-native";
import {useSQLiteContext} from "expo-sqlite";
import {useFocusEffect} from "expo-router";
import {Colors} from "@/constants/theme";
import {loadAndSetServerToken, loadAndSetYuanValue} from "@/constants/helpers/db";
import {Equal} from "lucide-react-native/icons";

function SyncOptions() {
	return (
		<View style={{backgroundColor: "white", marginTop: 20}}>
			<Text>Option</Text>
		</View>
	);
}

export default function Settings() {
	const [yuanValue, setYuanValue] = useState<string>();
	const [serverToken, setServerToken] = useState<string>();
	const [serverOnline, setServerOnline] = useState<boolean>(false);
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
	}

	useFocusEffect(() => {
		loadAndSetYuanValue(db, setYuanValue);
		loadAndSetServerToken(db, setServerToken);
		setServerOnline(false);
	});

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
			<View style={{marginTop: 20}} >
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
			{serverOnline && <SyncOptions/>}
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