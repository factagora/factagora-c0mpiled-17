// In-memory score board and verdict store. A restart or redeploy clears both. Swap the storage by keeping the same functions.
const crypto = require("node:crypto");

const MAX_ENTRIES = 1000;
const NICK_OK = /^[\p{L}\p{N}_-]{2,12}$/u; // same rule as the nickname form on the game screen
const ENDING_RANK = { SOLVED: 0, PARTLY: 1, WRONG: 2 };

// Returns { nick } (null when absent) or { error }.
function parseNick(value) {
  if (value === undefined || value === null || value === "") return { nick: null };
  if (typeof value !== "string" || !NICK_OK.test(value.trim())) return { error: "nick must be 2 to 12 letters, numbers, _ or -." };
  return { nick: value.trim() };
}

// A right culprit always beats a wrong one, then the higher motive score; ties keep the earlier entry first.
const before = (a, b) => ENDING_RANK[a.ending] - ENDING_RANK[b.ending] || b.score - a.score;

function createLeaderboard({ max = MAX_ENTRIES, now = () => new Date() } = {}) {
  const entries = [];
  let nextId = 1;

  return {
    // The same nick may enter many times; every run is one entry. Returns { id, rank }, or nulls when the entry is below the cut.
    add({ nick, ending, score }) {
      const index = entries.findIndex((e) => before({ ending, score }, e) < 0);
      const at = index === -1 ? entries.length : index;
      if (at >= max) return { id: null, rank: null };
      const entry = { id: nextId++, nick, ending, score, at: now().toISOString() };
      entries.splice(at, 0, entry);
      if (entries.length > max) entries.pop();
      return { id: entry.id, rank: at + 1 };
    },
    top(limit = 100) {
      const rows = entries.slice(0, limit).map((e, i) => ({ rank: i + 1, nick: e.nick, ending: e.ending, score: e.score, at: e.at }));
      return { entries: rows, total: entries.length };
    },
  };
}

// Keeps each verdict for a while so the player can register it by id. The server's own score is what gets registered, never one sent by the browser.
function createVerdictStore({ ttlMs = 60 * 60 * 1000, max = 5000, now = Date.now } = {}) {
  const verdicts = new Map(); // id -> { ending, score, expires }; Map keeps insertion order, oldest first
  const prune = () => {
    for (const [id, v] of verdicts) if (v.expires <= now()) verdicts.delete(id);
    while (verdicts.size > max) verdicts.delete(verdicts.keys().next().value);
  };
  return {
    save({ ending, score }) {
      prune();
      const id = crypto.randomUUID();
      verdicts.set(id, { ending, score, expires: now() + ttlMs });
      return id;
    },
    // One use only: the verdict is gone after it is claimed. Returns null when the id is unknown, used or expired.
    claim(id) {
      prune();
      const v = typeof id === "string" ? verdicts.get(id) : undefined;
      if (!v) return null;
      verdicts.delete(id);
      return { ending: v.ending, score: v.score };
    },
  };
}

module.exports = { createLeaderboard, createVerdictStore, parseNick };
