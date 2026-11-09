const test = require("node:test");
const assert = require("node:assert");
const { parseAsk } = require("./server");

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
