import { create } from "zustand";

export type AppView = "home" | "canvas" | "models" | "chat" | "settings";

interface ViewState {
  currentView: AppView;
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  setView: (view: AppView) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setRightPanelOpen: (open: boolean) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  currentView: "home",
  sidebarOpen: true,
  rightPanelOpen: false,
  setView: (view) => set({ currentView: view }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
}));
