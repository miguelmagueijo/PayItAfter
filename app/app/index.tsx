import {FlatList, Pressable, Text, View} from "react-native";
import {Plus} from "lucide-react-native/icons";
import {Colors} from "@/constants/theme";
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import {SafeAreaView} from "react-native-safe-area-context";

export default function Index() {
	return (
		<View style={{margin: 20}}>
			<View style={{
				display: "flex",
				flexDirection: "row",
				backgroundColor: Colors.brightBackground,
				borderRadius: 5,
				paddingVertical: 25
			}}>
				<View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
					<Text style={{color: Colors.text, fontWeight: "bold", fontSize: 20}}>200039.23 ¥</Text>
					<Text style={{color: Colors.primary, fontSize: 12, fontWeight: "bold"}}>YUAN</Text>
				</View>
				<View style={{
					borderColor: Colors.softerSecondary,
					width: 0,
					height: 50,
					borderWidth: 2,
					borderRadius: 99,
					marginHorizontal: 2.5
				}}/>
				<View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
					<Text style={{color: Colors.text, fontWeight: "bold", fontSize: 20}}>400.32 €</Text>
					<Text style={{color: Colors.primary, fontSize: 12}}>EUR</Text>
				</View>
			</View>
			<View style={{
				marginTop: 15,
				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "center"
			}}>
				<Text style={{color: Colors.text, fontSize: 26, fontWeight: "bold"}}>
					Payments
				</Text>
				<Pressable
					style={{
						backgroundColor: Colors.brighterPrimary,
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
			<SafeAreaView mode={"margin"} style={{flex: 1, marginVertical: 20}} edges={{bottom: "maximum"}}>
				<FlatList data={[1, 2, 3, 4, 5, 1, 1, 5, 1, 1, 1, 1, 1, 1, 6, 10, 10, 10]}
						  contentContainerStyle={{rowGap: 15}}
						  renderItem={() => (<PaymentItem/>)}/>
			</SafeAreaView>
		</View>
	);
}

function PaymentItem() {
	return (
		<Swipeable overshootRight={false} overshootLeft={false}
				   renderLeftActions={() => (<Text
					   style={{backgroundColor: "red", verticalAlign: "middle", paddingHorizontal: 15}}>123</Text>)}>
			<Text style={{
				backgroundColor: "white",
				padding: 15
			}}>
				This is one item
			</Text>
		</Swipeable>
	);
}