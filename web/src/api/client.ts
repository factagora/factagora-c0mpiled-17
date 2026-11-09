// Calls to the game server (server.js). Errors come back as { error } with a 4xx/5xx status.
import type { PersonId } from "../core/data";

export interface Card { text: string; refs: string[] }
export interface Turn { character: PersonId; timepoint: string; question: string; answer: string; refs: string[]; at: number }
export type Ending = "SOLVED" | "PARTLY" | "WRONG";
export interface Motive { id: string; label: string; points: number; earned?: number; counted: boolean }
export interface Verdict {
  ending: Ending;
  title: string;
  summary: string[];
  correct: boolean;
  score: number;
  total_score?: number;
  culprit_points?: number;
  motive_points?: number;
  motives: Motive[];
  reaction: string;
  verdictId: string | null;
}
export interface ScoreRow { rank: number; nick: string; ending: Ending; score: number }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `request failed (${res.status})`);
  return data as T;
}
const post = <T>(url: string, body: unknown) =>
  request<T>(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export interface AskInput {
  gameId: string;
  character: PersonId;
  timepoint: string;
  question: string;
  history: { role: "user" | "assistant"; content: string }[];
  evidence: Card[];
}
export const askCharacter = (input: AskInput) => post<{ answer: string; refs: string[] }>("/api/ask", input);
export const accuse = (who: PersonId, memo: string) => post<Verdict>("/api/accuse", { who, memo });
export const registerScore = (nick: string, verdictId: string) =>
  post<{ entry: { id: string | null; rank: number | null }; total: number }>("/api/scores", { nick, verdictId });
export const fetchScores = () => request<{ entries: ScoreRow[]; total: number }>("/api/scores?limit=100");
