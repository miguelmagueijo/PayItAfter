import type {SQLiteDatabase} from "expo-sqlite";

export function loadAndSetYuanValue(db: SQLiteDatabase, setYuanValue: (value: string) => void) {
	const yuanValueRow = db.getFirstSync<{
		value: string
	}>("SELECT value FROM configuration WHERE id = 'yuan_value'");

	if (yuanValueRow && !isNaN(Number(yuanValueRow.value))) {
		setYuanValue(yuanValueRow.value);
	}
}

export const PAYMENT_TYPE = {
	USER: 0, // Paid by user only, friend doesn't pay anything
	USER_SPLIT: 1, // Paid by user, friend has to pay half
	FRIEND_SPLIT: 2, // Paid by friend, user has to pay half
} as const;