const test = require("node:test");
const assert = require("node:assert");
const { screenText } = require("./characters");

test("screenText turns story names into the names on the game screen", () => {
  assert.strictEqual(screenText("Jisoo Han"), "Julia Han");
  assert.strictEqual(screenText("Jisoo's file goes back into the box."), "Julia's file goes back into the box.");
  assert.strictEqual(screenText("Minjae confesses. Dohyun and Hana watch. Mr. Kim looks away."), "Marcus confesses. Daniel and Hannah watch. Ken looks away.");
  assert.strictEqual(screenText("Hana Yoo"), "Hannah Yoo");
});

test("screenText leaves other words and non-text values alone", () => {
  assert.strictEqual(screenText("Hanami in Pangyo"), "Hanami in Pangyo");
  assert.deepStrictEqual(screenText({ ending: "SOLVED", score: 70, lines: ["Jisoo"], correct: true }), { ending: "SOLVED", score: 70, lines: ["Julia"], correct: true });
});
