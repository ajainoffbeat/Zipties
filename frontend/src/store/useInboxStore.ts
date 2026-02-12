import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface Conversation {
  id: string;
  user: {
    name: string;
    initials: string;
    avatar?: string;
  };
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  otherUserId: string;
  isBlocked: boolean;
  blockedBy: string | null;
}

interface InboxState {
  conversations: Conversation[];
  selectedConvo: Conversation | null;
  setConversations: (data: Conversation[]) => void;
  setSelectedConvo: (convo: Conversation) => void;
  updateConversation: (convoId: string, payload: Partial<Conversation>) => void;
}

export const useInboxStore = create<InboxState>()(
  devtools((set) => ({
    conversations: [],
    selectedConvo: null,

    setConversations: (data) =>
      set({
        conversations: data,
      }),

    setSelectedConvo: (convo) =>
      set({ selectedConvo: convo }),

    updateConversation: (convoId, payload) =>
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === convoId ? { ...c, ...payload } : c
        ),
      })),
  }))
);
