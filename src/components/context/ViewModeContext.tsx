import { createContext, type ReactNode, useContext } from "react";

export type ViewMode = "grid" | "tv";

interface ViewModeContextValue {
	viewMode: ViewMode;
	isKioskMode: boolean;
}

const ViewModeContext = createContext<ViewModeContextValue>({
	viewMode: "grid",
	isKioskMode: false,
});

export function ViewModeProvider({
	children,
	viewMode,
	isKioskMode = false,
}: {
	children: ReactNode;
	viewMode: ViewMode;
	isKioskMode?: boolean;
}) {
	return (
		<ViewModeContext.Provider value={{ viewMode, isKioskMode }}>
			{children}
		</ViewModeContext.Provider>
	);
}

export function useViewMode() {
	return useContext(ViewModeContext);
}
