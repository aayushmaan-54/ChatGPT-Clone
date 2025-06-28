import { create } from "zustand";
import { ClientConversationType } from "../types/types";

interface ConversationState {
  conversations: ClientConversationType[];
  setConversations: (conversations: ClientConversationType[]) => void;
  addConversations: (conversations: ClientConversationType[]) => void;
  addOrUpdateConversation: (conversation: ClientConversationType) => void;
  updateConversationTitle: (conversationId: string, newTitle: string) => void;
  deleteConversation: (conversationId: string) => void;
}



export const useConversationStore = create<ConversationState>((set) => ({
  conversations: [],
  setConversations: (conversations) => set({ conversations }),

  addConversations: (newConversations) =>
    set((state) => {
      const conversationMap = new Map<string, ClientConversationType>();
      state.conversations.forEach((conv) => conversationMap.set(conv._id, conv));
      newConversations.forEach((conv) => conversationMap.set(conv._id, conv));
      return { conversations: Array.from(conversationMap.values()) };
    }),

  addOrUpdateConversation: (conversation) =>
    set((state) => {
      const conversationMap = new Map<string, ClientConversationType>();
      state.conversations.forEach((conv) => conversationMap.set(conv._id, conv));
      conversationMap.set(conversation._id, conversation);
      const sortedConversations = Array.from(conversationMap.values()).sort(
        (a, b) =>
          new Date(b.lastActiveAt).getTime() -
          new Date(a.lastActiveAt).getTime(),
      );
      return { conversations: sortedConversations };
    }),

  updateConversationTitle: (conversationId, newTitle) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv._id === conversationId
          ? { ...conv, conversationTitle: newTitle }
          : conv,
      ),
    })),

  deleteConversation: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.filter(
        (conv) => conv._id !== conversationId,
      ),
    })),
}));
