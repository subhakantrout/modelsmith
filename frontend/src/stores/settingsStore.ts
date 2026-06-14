import { create } from "zustand";

interface SettingsState {
  hfToken: string;
  setHfToken: (token: string) => void;
}

const STORAGE_KEY = "modelsmith-hf-token";

function loadToken(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function saveToken(token: string) {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch { /* noop */ }
}

export const useSettingsStore = create<SettingsState>((set) => ({
  hfToken: loadToken(),
  setHfToken: (token) => {
    saveToken(token);
    set({ hfToken: token });
  },
}));
