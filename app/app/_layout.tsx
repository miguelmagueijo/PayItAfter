import {DarkTheme, ThemeProvider} from "@react-navigation/native";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {Drawer} from "expo-router/drawer";
import {SQLiteDatabase, SQLiteProvider} from "expo-sqlite";
import {Banknote, Settings} from "lucide-react-native/icons";

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

export default function RootLayout() {
	return (
		<ThemeProvider value={DarkTheme}>
			<SQLiteProvider databaseName="data.db" onInit={handleDbInit}>
				<GestureHandlerRootView style={{flex: 1}}>
					<Drawer screenOptions={{
						drawerActiveBackgroundColor: "white",
						drawerHideStatusBarOnOpen: true
					}}>
						<Drawer.Screen name="index" options={{
							drawerLabel: "Payments",
							title: "Payments",
							drawerIcon: ({color, size}) => (<Banknote color={color} size={size}/>)
						}}/>
						<Drawer.Screen name="settings" options={{
							drawerLabel: "Settings",
							title: "App settings",
							drawerIcon: ({color, size}) => (<Settings color={color} size={size}/>)
						}}/>
					</Drawer>
				</GestureHandlerRootView>
			</SQLiteProvider>
		</ThemeProvider>
	);
}
