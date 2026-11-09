// The game save: chats, pinned cards, memo and found record cards. Kept in this browser (localStorage).
// A new game (answering the radio) wipes the previous one, so people sharing a browser never see each other's chats.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Card, Turn } from "../api/client";
import type { RecordId } from "../core/data";

export const MAX_PINS = 10;

interface GameState {
  id: string;
  turns: Turn[];
  pins: Card[];
  memo: string;
  records: RecordId[];
  newGame: () => void;
  addTurn: (turn: Turn) => void;
  setMemo: (memo: string) => void;
  appendMemo: (line: string) => void;
  // pinned cards go with every question; the right ones open locked memories
  togglePin: (card: Card) => "pinned" | "unpinned" | "full";
  addRecord: (id: RecordId) => void;
}

const empty = () => ({ id: crypto.randomUUID(), turns: [], pins: [], memo: "", records: [] });

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...empty(),
      newGame: () => set(empty()),
      addTurn: (turn) => set({ turns: [...get().turns, turn] }),
      setMemo: (memo) => set({ memo }),
      appendMemo: (line) => {
        const memo = get().memo.replace(/\s+$/, "");
        set({ memo: memo ? `${memo}\n${line}` : line });
      },
      togglePin: (card) => {
        const pins = get().pins;
        if (pins.some((c) => c.text === card.text)) {
          set({ pins: pins.filter((c) => c.text !== card.text) });
          return "unpinned";
        }
        if (pins.length >= MAX_PINS) return "full";
        set({ pins: [...pins, card] });
        return "pinned";
      },
      addRecord: (id) => {
        if (!get().records.includes(id)) set({ records: [...get().records, id] });
      },
    }),
    {
      name: "moonlight-game-v2",
      partialize: ({ id, turns, pins, memo, records }) => ({ id, turns, pins, memo, records }),
    },
  ),
);

export const isPinned = (pins: Card[], card: Card) => pins.some((c) => c.text === card.text);
