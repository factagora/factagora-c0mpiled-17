const test = require("node:test");
const assert = require("node:assert");
const { judge } = require("../lib/accuse");

test("right culprit with leak + debt motive is solved at 100", () => {
  const r = judge("minjae", "He sold the code to Nova to pay his father's medical debt, and Jisoo was going to expose it.");
  assert.equal(r.ending, "SOLVED");
  assert.equal(r.score, 100);
});

test("right culprit with a weak motive is partly solved", () => {
  const r = judge("minjae", "He wanted the credit for the prototype.");
  assert.equal(r.ending, "PARTLY");
  assert.equal(r.score, 30);
});

test("wrong culprit is wrong whatever the motive", () => {
  const r = judge("dohyun", "leak and debt");
  assert.equal(r.ending, "WRONG");
  assert.equal(r.correct, false);
});

test("only the two best motives count", () => {
  const r = judge("minjae", "leak, debt, prototype credit");
  assert.equal(r.score, 100);
  assert.equal(r.motives.filter(m => m.counted).length, 2);
});

test("invalid input is rejected", () => {
  assert.equal(judge("jisoo", "anything"), null);
  assert.equal(judge("minjae", "   "), null);
  assert.equal(judge("nobody", "leak"), null);
});
