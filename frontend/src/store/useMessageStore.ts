import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface Message {
  id: string;
  conversationId: string;
  sender: "me" | "them";
  content: string;
  time: string;
  isread: boolean;
  status: "sending" | "sent" | "delivered" | "read";
}

interface MessageState {
  messages: Message[];
  setMessages: (msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  prependMessages: (msgs: Message[]) => void;
  updateMessageStatus: (id: string, status: Message["status"]) => void;
  resetMessages: () => void;
}

export const useMessageStore = create<MessageState>()(
  devtools((set) => ({
    messages: [],

    setMessages: (msgs) => set({ messages: msgs }),

    addMessage: (msg) =>
      set((state) => {
        if (state.messages.some((m) => m.id === msg.id)) return state;
        return { messages: [...state.messages, msg] };
      }),

    prependMessages: (msgs) =>
      set((state) => ({
        messages: [...msgs, ...state.messages],
      })),

    updateMessageStatus: (id, status) =>
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === id ? { ...m, status } : m
        ),
      })),

    resetMessages: () => set({ messages: [] }),
  }))
);
