import {Pressable, Text, View} from "react-native";
import {Plus} from "lucide-react-native/icons";
import {COLORS} from "@/app/colors";

export default function Index() {
	return (
		<View style={{padding: 10, margin: 10}}>
			<View style={{
				display: "flex",
				flexDirection: "row",
				backgroundColor: COLORS.brightBackground,
				borderRadius: 5,
				paddingVertical: 25
			}}>
				<View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
					<Text style={{color: COLORS.text, fontWeight: "bold", fontSize: 20}}>200039.23 ¥</Text>
					<Text style={{color: COLORS.primary, fontSize: 12, fontWeight: "bold"}}>YUAN</Text>
				</View>
				<View style={{
					borderColor: COLORS.softerSecondary,
					width: 0,
					height: 50,
					borderWidth: 2,
					borderRadius: 99,
					marginHorizontal: 2.5
				}}/>
				<View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
					<Text style={{color: COLORS.text, fontWeight: "bold", fontSize: 20}}>400.32 €</Text>
					<Text style={{color: COLORS.primary, fontSize: 12}}>EUR</Text>
				</View>
			</View>
			<View style={{marginTop: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
				<Text style={{color: COLORS.text, fontSize: 26, fontWeight: "bold"}}>
					Payments
				</Text>
				<Pressable
					style={{
						backgroundColor: COLORS.brighterPrimary,
						alignItems: "center",
						borderRadius: 5,
						flexDirection: "row",
						paddingHorizontal: 5,
						paddingVertical: 5,
						gap: 3
					}}>
					<Plus strokeWidth={4}/>
				</Pressable>
			</View>
		</View>
	);
}
