import {DarkTheme, ThemeProvider} from "@react-navigation/native";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {Drawer} from "expo-router/drawer";
import {SQLiteDatabase, SQLiteProvider} from "expo-sqlite";
import {House, Settings} from "lucide-react-native/icons";
import {DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList} from "@react-navigation/drawer";
import {Text, View} from "react-native";
import {Colors} from "@/constants/theme";

export async function handleDbInit(db: SQLiteDatabase) {
	const DB_VERSION = 1;

	let result = await db.getFirstAsync<{ user_version: number }>(
		"PRAGMA user_version"
	);

	if (!result) {
		throw new Error("Error setting db");
	}

	if (result.user_version === DB_VERSION) {
		console.log("Database up to date!");
		return;
	}

	db.withTransactionSync(() => {
		db.execSync("DROP TABLE IF EXISTS configuration");
		db.execSync("DROP TABLE IF EXISTS payment");
		db.execSync("CREATE TABLE configuration (id TEXT PRIMARY KEY, value TEXT);");
		db.execSync("CREATE TABLE payment (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, total REAL NOT NULL, paid_by_user BOOLEAN NOT NULL DEFAULT FALSE, made_on TIMESTAMP);");
		db.execSync("INSERT INTO configuration VALUES ('yuan_value', '7.8');");
	});

	await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
}

function CustomDrawerContent(props: DrawerContentComponentProps) {
	return (
		<DrawerContentScrollView {...props}>
			<View style={{marginTop: 10, marginBottom: 20}}>
				<Text style={{textAlign: "center", fontSize: 30, color: "#f8eaef", fontWeight: "bold"}}>
					Pay It After
				</Text>
			</View>
			<DrawerItemList {...props}/>
		</DrawerContentScrollView>
	);
}

export default function RootLayout() {
	return (
		<ThemeProvider value={DarkTheme}>
			<SQLiteProvider databaseName="data.db" onInit={handleDbInit}>
				<GestureHandlerRootView style={{flex: 1}}>
					<Drawer
						screenOptions={{
							drawerActiveBackgroundColor: Colors.dark,
							drawerActiveTintColor: Colors.text,
							drawerStyle: {backgroundColor: Colors.background},
							headerTintColor: Colors.text,
							headerStyle: {backgroundColor: Colors.background},
							drawerHideStatusBarOnOpen: true
						}}
						drawerContent={CustomDrawerContent}
					>
						<Drawer.Screen name="index" options={{
							drawerLabel: "Home",
							title: "Home",
							drawerIcon: ({color, size}) => (<House color={color} size={size}/>)
						}}/>
						<Drawer.Screen name="settings" options={{
							drawerLabel: "Settings",
							title: "Settings",
							drawerIcon: ({color, size}) => (<Settings color={color} size={size}/>)
						}}/>
					</Drawer>
				</GestureHandlerRootView>
			</SQLiteProvider>
		</ThemeProvider>
	);
}
