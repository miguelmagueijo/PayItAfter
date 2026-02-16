import { Text, View } from "react-native";

export default function Index() {
  return (
    <View>
        <View style={{ padding: 10, margin: 10 }}>
            <Text style={{ fontWeight: "bold", color: "white", fontSize: 12, marginBottom: 5, opacity: 0.5 }}>Overall</Text>
            <View style={{ display: "flex", flexDirection: "row", backgroundColor: "#1f1f1f", borderRadius: 5, paddingVertical: 25 }}>
                <View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
                    <Text style={{color: "white", fontSize: 10, marginBottom: 2.5}}>YUAN</Text>
                    <Text style={{color: "white", fontWeight: "bold", fontSize: 16}}>2039.23 ¥</Text>
                </View>
                <View style={{borderColor: "#4d5156", width: 0, height: 50, borderWidth: 2, borderRadius: 99, marginHorizontal: 2.5}}/>
                <View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
                    <Text style={{color: "white", fontSize: 10, marginBottom: 2.5}}>EUR</Text>
                    <Text style={{color: "white", fontWeight: "bold", fontSize: 16}}>400.32 €</Text>
                </View>
            </View>
        </View>
      <Text>Testing out</Text>
    </View>
  );
}
