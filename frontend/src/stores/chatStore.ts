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
      messages: [...state.messages, { role: "user", content: prompt }, { role: "assistant", content: "" }],
      generating: true,
      error: null,
    }));

    try {
      const wsUrl = `ws://${window.location.host}/api/ws/chat`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        ws.send(JSON.stringify({ prompt }));
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "chunk") {
          set((state) => {
            const newMessages = [...state.messages];
            newMessages[newMessages.length - 1].content += data.text;
            return { messages: newMessages };
          });
        } else if (data.type === "done") {
          ws.close();
          set({ generating: false });
        } else if (data.type === "error") {
          set({ error: data.error, generating: false });
          ws.close();
        }
      };
      
      ws.onerror = () => {
        set({ error: "WebSocket connection failed. Ensure backend is running.", generating: false });
      };
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
