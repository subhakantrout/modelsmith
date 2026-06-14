import { create } from "zustand";

export type AppView = "home" | "canvas" | "models" | "chat" | "settings";

interface ViewState {
  currentView: AppView;
  rightPanelOpen: boolean;
  setView: (view: AppView) => void;
  setRightPanelOpen: (open: boolean) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  currentView: "home",
  rightPanelOpen: false,
  setView: (view) => set({ currentView: view }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
}));
