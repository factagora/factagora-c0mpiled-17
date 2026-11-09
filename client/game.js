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

export function newGame() {
  const game = { id: crypto.randomUUID(), turns: [], pins: [] };
  saveGame(game);
  return game;
}

export function loadGame() {
  try {
    const game = JSON.parse(localStorage.getItem(KEY));
    if (game && game.id && Array.isArray(game.turns)) {
      game.pins = Array.isArray(game.pins) ? game.pins : [];
      return game;
    }
  } catch {
    // Missing or broken data: start over.
  }
  return newGame();
}

// A card is one line the player pinned: "who (time point): what they said".
export const cardOf = (turn, names = {}) => `${names[turn.character] || turn.character} (${turn.timepoint}): ${turn.answer}`;

export function pin(game, turn, names) {
  const card = cardOf(turn, names);
  if (game.pins.includes(card) || game.pins.length >= MAX_PINS) return false;
  game.pins.push(card);
  saveGame(game);
  return true;
}

export function unpin(game, card) {
  game.pins = game.pins.filter((c) => c !== card);
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
  const turn = { character, timepoint, question, answer: data.answer, at: Date.now() };
  game.turns.push(turn);
  saveGame(game);
  return turn;
}
