export const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const getAuthHeader = (token: string) => {
	return `PIA ${token}`;
}