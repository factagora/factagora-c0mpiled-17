// Player state lives in this browser (localStorage). The server keeps no game state.
//   import { loadGame, newGame, ask, pin, unpin, caseLog } from "/client/game.js";
//   const game = loadGame();
//   const turn = await ask(game, "minjae", "T2016", "지금 어디세요?");
//   pin(game, turn, names);   // pinned cards go to every later question as evidence
//   caseLog(game);            // every turn, in in-game time order, for the case record
//
// Design: a character only remembers its own conversation at the same time point.
// Anything from another time point reaches it only as a pinned card.

const KEY = "moonlight-game";
const MAX_PINS = 10;

export function saveGame(game) {
  try {
    localStorage.setItem(KEY, JSON.stringify(game));
  } catch {
    // Private mode or full storage: the game still runs, it just is not kept.
  }
}

// A new game wipes the previous one from this browser (turns, pins and memo).
export function newGame() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: nothing to wipe.
  }
  const game = { id: crypto.randomUUID(), turns: [], pins: [], memo: "" };
  saveGame(game);
  return game;
}

export function loadGame() {
  try {
    const game = JSON.parse(localStorage.getItem(KEY));
    if (game && game.id && Array.isArray(game.turns)) {
      // Older saves kept pins as plain text.
      game.pins = (Array.isArray(game.pins) ? game.pins : []).map((c) => (typeof c === "string" ? { text: c, refs: [] } : c));
      game.memo = typeof game.memo === "string" ? game.memo : "";
      return game;
    }
  } catch {
    // Missing or broken data: start over.
  }
  return newGame();
}

// A card is one answer the player pinned: its text plus the refs of the memories behind it.
// Showing a card with the right refs to someone else opens what they were keeping back.
export const cardOf = (turn, names = {}) => ({
  text: `${names[turn.character] || turn.character} (${turn.timepoint}): ${turn.answer}`,
  refs: turn.refs || [],
});

// Record cards from the case data (data/case.json is safe to send to the browser) can be pinned as { text, refs } too.
export function pin(game, turnOrCard, names) {
  const card = "answer" in turnOrCard ? cardOf(turnOrCard, names) : turnOrCard;
  if (game.pins.some((c) => c.text === card.text) || game.pins.length >= MAX_PINS) return false;
  game.pins.push(card);
  saveGame(game);
  return true;
}

export function unpin(game, text) {
  game.pins = game.pins.filter((c) => c.text !== text);
  saveGame(game);
}

// Every turn across time points, in in-game time order (time point ids sort by year), then by when it was asked.
export const caseLog = (game) =>
  [...game.turns].sort((a, b) => String(a.timepoint).localeCompare(String(b.timepoint)) || a.at - b.at);

// Asks one character at one time point. Only that character's turns at that time point go back as history.
export async function ask(game, character, timepoint, question) {
  const history = game.turns
    .filter((t) => t.character === character && t.timepoint === timepoint)
    .slice(-10)
    .flatMap((t) => [
      { role: "user", content: t.question },
      { role: "assistant", content: t.answer },
    ]);
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId: game.id, character, timepoint, question, history, evidence: game.pins }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  const turn = { character, timepoint, question, answer: data.answer, refs: data.refs || [], at: Date.now() };
  game.turns.push(turn);
  saveGame(game);
  return turn;
}
