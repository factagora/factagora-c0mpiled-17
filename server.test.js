const test = require("node:test");
const assert = require("node:assert");
const { parseAsk } = require("./server");
const { hiddenRefs } = require("./characters");

test("parseAsk keeps a good request", () => {
  const r = parseAsk({ character: "minjae", timepoint: "T2016", question: " 지금 어디세요? ", history: [{ role: "user", content: "안녕" }], evidence: [] });
  assert.deepStrictEqual(r, { gameId: null, character: "minjae", timepoint: "T2016", question: "지금 어디세요?", history: [{ role: "user", content: "안녕" }], evidence: [] });
});

test("parseAsk refuses bad input", () => {
  assert.ok(parseAsk({ character: "__proto__", timepoint: "T2016", question: "q" }).error);
  assert.ok(parseAsk({ character: "jisoo", timepoint: "T2026", question: "q" }).error); // Jisoo is dead in 2026
  assert.ok(parseAsk({ character: "minjae", timepoint: "toString", question: "q" }).error);
  assert.ok(parseAsk({ character: "minjae", timepoint: "T2016", question: "" }).error);
  assert.ok(parseAsk({ character: "minjae", timepoint: "T2016", question: "q", history: [{ role: "system", content: "x" }] }).error);
  assert.ok(parseAsk({ character: "minjae", timepoint: "T2016", question: "q", evidence: Array(11).fill("e") }).error);
});

test("hiddenRefs keeps secrets until the right cards are pinned", () => {
  // Ken 2026 names Marcus (F10, F46) only with both F45 and L05 pinned; the envelope (F24) needs F24.
  assert.deepStrictEqual([...hiddenRefs("kim", "T2026")].sort(), ["F10", "F24", "F46"]);
  assert.ok(hiddenRefs("kim", "T2026", ["F45"]).has("F10"));
  assert.ok(!hiddenRefs("kim", "T2026", ["F45", "L05"]).has("F10"));
  assert.ok(!hiddenRefs("kim", "T2026", ["F24"]).has("F24"));
  // Hannah 2016 tells about the hoodie (open question) even though F11 is in never_reveal.
  assert.ok(!hiddenRefs("hana", "T2016").has("F11"));
  // Marcus never gives up the Nova deal on his own.
  assert.ok(hiddenRefs("minjae", "T2026", ["F45", "L05", "F52"]).has("F03"));
});
