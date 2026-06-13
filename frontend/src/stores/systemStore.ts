import { create } from "zustand";
import type { SystemInfo } from "../types/api";
import { api } from "../lib/api";

interface SystemState {
  info: SystemInfo | null;
  loading: boolean;
  error: string | null;
  fetchSpecs: () => Promise<void>;
}

export const useSystemStore = create<SystemState>((set) => ({
  info: null,
  loading: false,
  error: null,

  fetchSpecs: async () => {
    set({ loading: true, error: null });
    try {
      const info = await api.system.specs();
      set({ info, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));
