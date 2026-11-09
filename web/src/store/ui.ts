// Screen state for this page load: which screen, which year and person, the accusation and the toast.
import { create } from "zustand";
import type { Verdict } from "../api/client";
import { type Era, type PersonId, isHere } from "../core/data";

export type Screen = "title" | "brief" | "map" | "places" | "board";

interface UiState {
  screen: Screen;
  era: Era;
  person: PersonId | null;
  visited: string[]; // person + era already asked, for the NEW badge
  erasSeen: Era[]; // years visited on the radio, for record cards
  asking: string | null; // the question waiting for an answer
  briefPlayed: boolean;
  accuseOpen: boolean;
  verdict: Verdict | null;
  accused: PersonId | null;
  verdictOpen: boolean;
  me: { nick: string; rank: number | null } | null;
  toast: { msg: string; key: number } | null;
  go: (screen: Screen) => void;
  setEra: (era: Era) => void;
  openTalk: (k: PersonId) => void;
  setAsking: (q: string | null) => void;
  setAccuseOpen: (open: boolean) => void;
  setVerdict: (v: Verdict, who: PersonId) => void;
  setVerdictOpen: (open: boolean) => void;
  setMe: (me: { nick: string; rank: number | null }) => void;
  showToast: (msg: string) => void;
}

export const useUi = create<UiState>()((set, get) => ({
  screen: "title",
  era: "2016",
  person: null,
  visited: [],
  erasSeen: ["2016"],
  asking: null,
  briefPlayed: false,
  accuseOpen: false,
  verdict: null,
  accused: null,
  verdictOpen: false,
  me: null,
  toast: null,
  go: (screen) => set(screen === "map" && get().screen === "brief" ? { screen, briefPlayed: true } : { screen }),
  setEra: (era) => {
    const { person, erasSeen } = get();
    set({
      era,
      erasSeen: erasSeen.includes(era) ? erasSeen : [...erasSeen, era],
      person: person && isHere(person, era) ? person : null, // only people present that year can be asked
    });
  },
  openTalk: (k) => {
    const { era, visited } = get();
    if (!isHere(k, era)) return;
    set({ person: k, visited: visited.includes(k + era) ? visited : [...visited, k + era] });
  },
  setAsking: (asking) => set({ asking }),
  setAccuseOpen: (accuseOpen) => set({ accuseOpen }),
  setVerdict: (verdict, accused) => set({ verdict, accused, verdictOpen: true }),
  setVerdictOpen: (verdictOpen) => set({ verdictOpen }),
  setMe: (me) => set({ me }),
  showToast: (msg) => set({ toast: { msg, key: Date.now() } }),
}));

export const toast = (msg: string) => useUi.getState().showToast(msg);
