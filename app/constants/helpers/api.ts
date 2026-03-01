export const API_URL = "http://192.168.1.126:8900";

export const getAuthHeader = (token: string) => {
    return `PIA ${token}`;
}