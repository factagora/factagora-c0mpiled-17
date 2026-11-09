// Judges an accusation against the backend-only solution in data/server.json.
const CASE = require("./data/case.json");
const { solution, endings, accuse_reactions } = require("./data/server.json");

// Free-text motive → motive ids by keyword (lowercase substring match, English + Korean).
// shortcut: keyword matching misreads negations ("not about debt") and rewards listing every motive; upgrade to an LLM judge if players game it.
const MOTIVE_KEYWORDS = {
  m_leak: ["leak", "stole", "steal", "sold the code", "selling the code", "source code", "expose", "exposing", "exposure", "tell the investor", "told the investor", "유출", "폭로", "코드를 팔"],
  m_debt: ["debt", "medical", "hospital", "father", "dad", "paid off", "loan", "빚", "병원", "아버지", "아빠", "병원비"],
  m_credit: ["credit", "prototype", "recognition", "built it first", "공로", "프로토타입", "인정"],
  m_numbers: ["user numbers", "inflat", "padded", "fake users", "부풀"],
  m_romance: ["love", "romanc", "rejected him", "crush", "연애", "사랑", "고백", "차였"],
  m_cto: ["cto", "take over", "promotion", "승진", "자리를"]
};
const LABELS = Object.fromEntries(CASE.motive_options.map(m => [m.id, m.label]));
const SUSPECTS = CASE.characters.map(c => c.id).filter(id => id !== "jisoo");

function scoreMotive(text) {
  const t = text.toLowerCase();
  const found = Object.keys(MOTIVE_KEYWORDS)
    .filter(id => MOTIVE_KEYWORDS[id].some(k => t.includes(k)))
    .map(id => ({ id, label: LABELS[id], points: solution.motive_scores[id] }))
    .sort((a, b) => b.points - a.points);
  // same rule as the data: main + one hidden motive, capped at 100
  const counted = found.slice(0, 2);
  const score = Math.min(100, counted.reduce((s, m) => s + m.points, 0));
  return { score, motives: found.map(m => ({ ...m, counted: counted.includes(m) })) };
}

// Returns null when the input is invalid. The contradiction-based DISMISSED ending is not used: the game has no contradiction step yet.
function judge(who, motive) {
  if (!SUSPECTS.includes(who) || typeof motive !== "string" || !motive.trim() || motive.length > 2000) return null;
  const correct = who === solution.culprit;
  const { score, motives } = scoreMotive(motive);
  const key = !correct ? "WRONG" : score >= 70 ? "SOLVED" : "PARTLY";
  const r = accuse_reactions[who];
  return {
    ending: key,
    title: endings[key].title,
    summary: endings[key].summary,
    correct,
    score,
    motives,
    reaction: correct ? r.breaks : r.rebuttal
  };
}

module.exports = { judge, SUSPECTS };
