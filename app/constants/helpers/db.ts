import type {SQLiteDatabase} from "expo-sqlite";

export function loadAndSetYuanValue(db: SQLiteDatabase, setYuanValue: (value: string) => void) {
	const yuanValueRow = db.getFirstSync<{
		value: string
	}>("SELECT value FROM configuration WHERE id = 'yuan_value'");

	if (yuanValueRow && !isNaN(Number(yuanValueRow.value))) {
		setYuanValue(yuanValueRow.value);
	}
}