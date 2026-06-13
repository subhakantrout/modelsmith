import { create } from "zustand";
import { api } from "../lib/api";
import type { ChatStatus } from "../types/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatState {
  messages: Message[];
  generating: boolean;
  error: string | null;
  status: ChatStatus | null;
  sendMessage: (prompt: string) => Promise<void>;
  fetchStatus: () => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  generating: false,
  error: null,
  status: null,

  sendMessage: async (prompt: string) => {
    if (!prompt.trim()) return;
    set((state) => ({
      messages: [...state.messages, { role: "user", content: prompt }],
      generating: true,
      error: null,
    }));
    try {
      const result = await api.chat.generate({ prompt });
      set((state) => ({
        messages: [...state.messages, { role: "assistant", content: result.text }],
        generating: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, generating: false });
    }
  },

  fetchStatus: async () => {
    try {
      const status = await api.chat.status();
      set({ status });
    } catch {
      // ignore network errors silently
    }
  },

  clearMessages: () => set({ messages: [], error: null }),
}));
