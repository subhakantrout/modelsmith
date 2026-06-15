import { create } from "zustand";

interface SettingsState {
  hfToken: string;
  setHfToken: (token: string) => void;
}

const STORAGE_KEY = "modelsmith-hf-token";
const KEY_STORAGE_KEY = "modelsmith-hf-key";

function getOrCreateKey(): string {
  try {
    let key = sessionStorage.getItem(KEY_STORAGE_KEY);
    if (!key) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      key = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      sessionStorage.setItem(KEY_STORAGE_KEY, key);
    }
    return key;
  } catch {
    return "default-key-fallback";
  }
}

function xorEncrypt(text: string, key: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  try {
    return btoa(result);
  } catch {
    return "";
  }
}

function xorDecrypt(encoded: string, key: string): string {
  try {
    const text = atob(encoded);
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return "";
  }
}

function loadToken(): string {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return "";
    const key = getOrCreateKey();
    return xorDecrypt(encrypted, key);
  } catch {
    return "";
  }
}

function saveToken(token: string) {
  try {
    const key = getOrCreateKey();
    const encrypted = xorEncrypt(token, key);
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch { /* noop */ }
}

export const useSettingsStore = create<SettingsState>((set) => ({
  hfToken: loadToken(),
  setHfToken: (token) => {
    saveToken(token);
    set({ hfToken: token });
  },
}));
