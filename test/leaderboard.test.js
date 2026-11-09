const test = require("node:test");
const assert = require("node:assert");
const { createLeaderboard, createVerdictStore, parseNick } = require("../lib/leaderboard");
const { createLimiter } = require("../lib/ratelimit");

const run = (nick, ending, score) => ({ nick, ending, score });
const order = (b) => b.top().entries.map((e) => `${e.rank}:${e.nick}`);

test("a right culprit always ranks above a wrong one, then by score, then by who came first", () => {
  const b = createLeaderboard();
  b.add(run("wrong100", "WRONG", 100));
  b.add(run("partly30", "PARTLY", 30));
  b.add(run("solved70", "SOLVED", 70));
  b.add(run("solved100", "SOLVED", 100));
  b.add(run("solved70b", "SOLVED", 70));
  assert.deepEqual(order(b), ["1:solved100", "2:solved70", "3:solved70b", "4:partly30", "5:wrong100"]);
});

test("add returns the rank, and the same nick may enter many times", () => {
  const b = createLeaderboard();
  assert.equal(b.add(run("sky", "PARTLY", 30)).rank, 1);
  assert.equal(b.add(run("sky", "SOLVED", 100)).rank, 1);
  assert.equal(b.add(run("sky", "WRONG", 1)).rank, 3);
  const { entries, total } = b.top();
  assert.equal(total, 3);
  assert.deepEqual(entries.map((e) => e.ending), ["SOLVED", "PARTLY", "WRONG"]);
});

test("rows carry what the screen draws: rank, nick, ending, score", () => {
  const b = createLeaderboard();
  b.add(run("sky", "SOLVED", 100));
  const [row] = b.top().entries;
  assert.equal(row.rank, 1);
  assert.equal(row.nick, "sky");
  assert.equal(row.ending, "SOLVED");
  assert.equal(row.score, 100);
});

test("top(n) limits the list but total counts everything", () => {
  const b = createLeaderboard();
  for (let i = 1; i <= 5; i++) b.add(run(`p${i}`, "SOLVED", i * 10));
  const { entries, total } = b.top(2);
  assert.equal(entries.length, 2);
  assert.equal(total, 5);
});

test("the board keeps only the best entries when it is full", () => {
  const b = createLeaderboard({ max: 3 });
  for (const s of [10, 20, 30]) b.add(run("x1", "SOLVED", s));
  assert.deepEqual(b.add(run("low", "WRONG", 100)), { id: null, rank: null });
  assert.equal(b.add(run("high", "SOLVED", 99)).rank, 1);
  const { entries, total } = b.top(10);
  assert.equal(total, 3);
  assert.deepEqual(entries.map((e) => e.score), [99, 30, 20]);
});

test("nick follows the screen's rule: 2 to 12 letters, numbers, _ or -", () => {
  assert.deepEqual(parseNick(undefined), { nick: null });
  assert.deepEqual(parseNick(null), { nick: null });
  assert.deepEqual(parseNick(""), { nick: null });
  assert.deepEqual(parseNick(" noir_cat "), { nick: "noir_cat" });
  assert.deepEqual(parseNick("하늘-1"), { nick: "하늘-1" });
  for (const bad of ["a", "x".repeat(13), "has space", "<b>hi</b>", "a.b", 42, {}]) assert.ok(parseNick(bad).error, String(bad));
});

test("a verdict can be claimed once, and only until it expires", () => {
  let t = 0;
  const store = createVerdictStore({ ttlMs: 1000, now: () => t });
  const id = store.save({ ending: "SOLVED", score: 70, extra: "ignored" });
  assert.deepEqual(store.claim(id), { ending: "SOLVED", score: 70 });
  assert.equal(store.claim(id), null);
  const late = store.save({ ending: "WRONG", score: 1 });
  t = 1000;
  assert.equal(store.claim(late), null);
});

test("unknown or malformed verdict ids are refused", () => {
  const store = createVerdictStore();
  for (const bad of ["nope", "", undefined, null, 5, {}]) assert.equal(store.claim(bad), null);
});

test("the verdict store drops the oldest verdicts past its limit", () => {
  const store = createVerdictStore({ max: 2 });
  const [a, b, c] = ["a", "b", "c"].map((x) => store.save({ ending: "WRONG", score: x.length }));
  assert.equal(store.claim(a), null);
  assert.ok(store.claim(b));
  assert.ok(store.claim(c));
});

test("the limiter allows max requests per window per client", () => {
  let t = 0;
  const allow = createLimiter({ max: 2, windowMs: 1000, now: () => t });
  assert.equal(allow("a"), true);
  assert.equal(allow("a"), true);
  assert.equal(allow("a"), false);
  assert.equal(allow("b"), true);
  t = 1000;
  assert.equal(allow("a"), true);
});
