import {Alert, Pressable, StyleSheet, Text, TextInput, View} from "react-native";
import {useState} from "react";
import {Check} from "lucide-react-native";
import {useSQLiteContext} from "expo-sqlite";
import {useFocusEffect} from "expo-router";

export default function Settings() {
	const [yuanValue, setYuanValue] = useState<string>();
	const db = useSQLiteContext();

	function loadAndSetYuanValue() {
		const yuanValueRow = db.getFirstSync<{
			value: string
		}>("SELECT value FROM configuration WHERE id = 'yuan_value'");

		if (yuanValueRow && !isNaN(Number(yuanValueRow.value))) {
			setYuanValue(yuanValueRow.value);
		}
	}

	function handleYuanValueSave() {
		if (!yuanValue || isNaN(Number(yuanValue))) {
			Alert.alert("Invalid yuan value");
			return;
		}
	}

	useFocusEffect(() => {
		loadAndSetYuanValue();
	});

	return (
		<View style={{padding: 15}}>
			<Text style={{color: "white", fontSize: 14, fontWeight: "bold", opacity: 0.5}}>CONVERSION RATE</Text>
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
							color: "white"
						}}
						inputMode="decimal"
						value={"1"}
						readOnly={true}
					/>
					<Text style={styles.moneySymbol}>€</Text>
				</View>
				<Text style={{color: "white", fontSize: 26, fontWeight: "bold"}}>=</Text>
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
							backgroundColor: pressed ? "#c02b0e" : "#f9793e",
						},
						styles.saveButton,
					]}
					onPress={handleYuanValueSave}
				>
					<Check color={"white"} size={28}/>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	moneySymbol: {
		display: "flex",
		color: "white",
		fontSize: 20,
		fontWeight: "bold",
		paddingHorizontal: 15,
	},
	yuanInput: {
		flex: 1,
		textAlign: "center",
		fontSize: 20,
		fontWeight: "bold",
		backgroundColor: "#191c1c",
		color: "white"
	},
	moneyWrapper: {
		flex: 1,
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 4,
		borderRadius: 5,
		borderColor: "#282928",
		backgroundColor: "rgba(201, 201, 201, 0.2)",
		height: 55
	},
	saveButton: {
		justifyContent: "center",
		alignItems: "center",
		height: 55,
		borderRadius: 5,
		padding: 10,
	}
})