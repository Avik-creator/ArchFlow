import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { UIMessage } from "ai"

export type ChatMode = "create" | "understand"

interface ChatHistoryState {
  histories: Record<ChatMode, UIMessage[]>
  setHistory: (mode: ChatMode, messages: UIMessage[]) => void
  clearHistory: (mode?: ChatMode) => void
}

const emptyHistories: Record<ChatMode, UIMessage[]> = {
  create: [],
  understand: [],
}

export const useChatHistoryStore = create<ChatHistoryState>()(
  persist(
    (set) => ({
      histories: emptyHistories,
      setHistory: (mode, messages) =>
        set((state) => ({
          histories: {
            ...state.histories,
            [mode]: messages,
          },
        })),
      clearHistory: (mode) =>
        set((state) => {
          if (!mode) {
            return { histories: emptyHistories }
          }
          return {
            histories: {
              ...state.histories,
              [mode]: [],
            },
          }
        }),
    }),
    {
      name: "archflow-chat-history",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

