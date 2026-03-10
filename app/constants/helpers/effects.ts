import {useCallback, useEffect} from "react";
import {useFocusEffect} from "expo-router";
import {AppState} from "react-native";

export function useActiveEffect(callback: () => void) {
	const cb = useCallback(callback, [callback])

	useFocusEffect(cb)

	useEffect(() => {
		const sub = AppState.addEventListener("change", (s) => {
			if (s === "active") {
				cb();
			}
		});
		
		return () => sub.remove();
	}, [cb]);
}