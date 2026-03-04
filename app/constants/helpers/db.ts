import type {SQLiteDatabase} from "expo-sqlite";

export function loadAndSetYuanValue(db: SQLiteDatabase): string {
	const yuanValueRow = db.getFirstSync<{
		value: string
	}>("SELECT value FROM configuration WHERE id = 'yuan_value'");

	if (yuanValueRow && !isNaN(Number(yuanValueRow.value))) {
		return yuanValueRow.value;
	}

	return "";
}

export function loadServerToken(db: SQLiteDatabase, setServerToken: ((value: string) => void) | undefined = undefined) {
	const serverTokenRow = db.getFirstSync<{
		value: string
	}>("SELECT value FROM configuration WHERE id = 'server_token'");

	if (serverTokenRow) {
		if (setServerToken) {
			setServerToken(serverTokenRow.value);
		}

		return serverTokenRow.value;
	}

	return null;
}

export const NO_TOKEN_VALUE = "TOKEN_NOT_SET";

export const DB_PAYMENT_TYPE = {
	USER: 0, // Paid by user only, friend doesn't pay anything
	USER_SPLIT: 1, // Paid by user, friend has to pay half
	FRIEND_SPLIT: 2, // Paid by friend, user has to pay half
	USER_PAYS_FRIEND: 3, // User pays his debt to friend
	FRIEND_PAYS_USER: 4, // Friend pays his debt to user
	DEBT_TO_FRIEND: 5, // User owes money to friend
	DEBT_TO_USER: 6, // Friend owes money to user
} as const;