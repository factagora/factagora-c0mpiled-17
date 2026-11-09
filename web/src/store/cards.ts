// Cards the player can show to people: a pinned answer or a found piece of evidence.
import type { Card, Turn } from "../api/client";
import { type Evidence, PEOPLE } from "../core/data";
import { useGame } from "./game";
import { toast } from "./ui";

export const whenOf = (timepoint: string) => (timepoint === "T2026" ? "2026 · now" : `${timepoint.slice(1)}-03-15 22:50`);
export const turnCard = (t: Turn): Card => ({ text: `${PEOPLE[t.character]?.short ?? t.character} (${t.timepoint.slice(1)}): ${t.answer}`, refs: t.refs ?? [] });
export const evidenceCard = (e: Evidence): Card => ({ text: `[evidence] ${e.title}`, refs: e.refs });

export function togglePin(card: Card) {
  const result = useGame.getState().togglePin(card);
  toast(result === "full" ? "you can show 10 cards at most. take one back first." : result === "pinned" ? "you will show this to the people you question" : "card taken back");
}
