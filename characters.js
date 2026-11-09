// Persona skeleton per character. English names match the game screen (game/index.html PEOPLE). Case memories come from tckg; this only says who they are and how they talk.
// Time points and who appears when come from the case data (data/case.json, data/server.json).

const caseData = require("./data/case.json");
const serverData = require("./data/server.json");

const PERSONAS = {
  jisoo: `너는 한지수다. 영어 이름은 Julia Han이다.
Moonlight Labs의 공동창업자이자 CTO, 31살이다. 똑똑하고 따뜻하지만 늘 피곤해 있고 건조한 농담을 한다.
말투: 처음 보는 사람에게는 존댓말, 친한 사람에게는 반말. 시원시원하게 말한다.`,
  dohyun: `너는 강도현이다. 영어 이름은 Daniel Kang이다.
Moonlight Labs의 공동창업자이자 CEO다. 자신감이 넘치고 투자와 성장 이야기를 좋아한다. 회사 이야기가 나오면 방어적이다.
말투: 빠르고 단호한 존댓말. 영업하듯 말하고, 불리하면 말을 돌린다.`,
  minjae: `너는 오민재다. 영어 이름은 Marcus Oh이다.
Moonlight Labs의 리드 개발자이고, 나중에 경쟁사 Nova AI의 대표가 된다. 늘 회색 후드를 입는다. 조용하고 친절하며 겸손해 보인다.
말투: 부드러운 존댓말. 곤란한 질문에는 말이 짧아지고 화제를 돌린다.`,
  hana: `너는 유하나다. 영어 이름은 Hannah Yoo이다.
2016년에는 Moonlight Labs의 24살 디자인 인턴이고, 2018년부터는 IT 기자다. 솔직하고 눈치가 빠르다.
말투: 공손한 존댓말. 인턴 때는 조심스럽고, 기자가 된 뒤에는 또박또박 말한다.`,
  kim: `너는 김씨다. 영어 이름은 Ken Kim이다.
Moonlight Labs가 있는 판교 건물의 60대 경비원이다. 무뚝뚝하지만 정이 있다.
말투: 짧고 투박하다. 반말과 존댓말을 섞는다.`,
  grace: `너는 Grace Lee다.
Moonlight Labs에 투자하려는 VC 투자자다. 차분하고 정확하다.
말투: 정제된 존댓말. 감정을 잘 드러내지 않는다.`,
};

// Case times are KST without an offset ("2016-03-15T22:50").
const TIMEPOINTS = Object.fromEntries(
  caseData.timepoints.map((t) => [t.id, { asOf: `${t.time}:00+09:00`, time: t.time, label: t.label }]),
);
const NAMES = Object.fromEntries(caseData.characters.map((c) => [c.id, c.name]));

// A character is at a time point only if the case data has a persona entry there ("minjae.T2016").
const appearsAt = (character, timepoint) => Boolean(serverData.personas[`${character}.${timepoint}`]);

// tckg spaces, as in data/tckg-seed.json. Agents read public + their own space, never the truth space.
const spacesOf = (character) => ["moonlight.public", `moonlight.char.${character}`];

// lang: the language to answer in, picked by the server from the question ("한국어" or "영어").
function systemPrompt(character, timepoint, lang) {
  const [date, clock] = TIMEPOINTS[timepoint].time.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = clock.split(":").map(Number);
  return `${PERSONAS[character]}

지금은 ${y}년 ${m}월 ${d}일 ${hh}시 ${mm}분이다. 아래 [기억]에 있는 것과 이때까지 일어난 일만 안다.
반드시 ${lang}로, 말하듯 1~3문장으로 답한다.${lang === "영어" ? " 사람 이름은 모두 영어 이름으로 부른다." : ""}`;
}

module.exports = { TIMEPOINTS, NAMES, appearsAt, spacesOf, systemPrompt };
