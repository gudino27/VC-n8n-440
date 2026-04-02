import { create } from 'zustand';

export const useChatStore = create((set) => ({
  isOpen: false,
  hasUnread: false,
  messages: [],
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen, hasUnread: false })),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message],
    hasUnread: !state.isOpen 
  })),
}));