// Case data the screens need: people, time points, places, record cards and evidence.
// shortcut: copied from data/case.json for now; serve it from GET /api/case so the server data is the only source.
import type { CSSProperties } from "react";

export type PersonId = "jisoo" | "dohyun" | "minjae" | "hana" | "kim" | "grace";
export type Era = "2015" | "2016" | "2017" | "2018" | "2019" | "2025" | "2026";
export type Look = "2016" | "mid" | "2026";

export interface Person {
  name: string;
  short: string;
  ini: string;
  hair: string;
  suit: string;
  img: string;
  face: Partial<Record<Look, string>>;
}

export const PEOPLE: Record<PersonId, Person> = {
  jisoo: { name: "Julia Han", short: "Julia", ini: "JH", hair: "#1a1230", suit: "#2f6f8f", img: "jisoo", face: { "2016": "neutral" } },
  dohyun: { name: "Daniel Kang", short: "Daniel", ini: "DK", hair: "#2a1d14", suit: "#4a4a6a", img: "dohyun", face: { "2016": "neutral", mid: "neutral", "2026": "defensive" } },
  minjae: { name: "Marcus Oh", short: "Marcus", ini: "MO", hair: "#141018", suit: "#6a3a5a", img: "minjae", face: { "2016": "neutral", mid: "neutral", "2026": "neutral" } },
  hana: { name: "Hannah Yoo", short: "Hannah", ini: "HY", hair: "#5a2e1a", suit: "#c9a24a", img: "hana", face: { "2016": "neutral", mid: "neutral", "2026": "neutral" } },
  kim: { name: "Ken Kim", short: "Ken", ini: "KK", hair: "#b8b4c8", suit: "#3a5a3a", img: "kim", face: { "2016": "neutral", "2026": "guilty" } },
  grace: { name: "Grace Lee", short: "Grace", ini: "GL", hair: "#3a2418", suit: "#8a2a3a", img: "grace", face: { "2016": "neutral", "2026": "neutral" } },
};
export const ORDER: PersonId[] = ["jisoo", "dohyun", "minjae", "hana", "kim", "grace"];
export const SUSPECTS = ORDER.filter((k) => k !== "jisoo"); // Julia is the victim

// Role shown under a person, by year.
export function roleOf(k: PersonId, y: number): string {
  return {
    jisoo: "co-founder, cto",
    dohyun: y < 2025 ? "ceo, co-founder" : "ceo, now a unicorn",
    minjae: y <= 2017 ? "lead developer" : y < 2025 ? "now at nova ai" : "ceo, nova ai",
    hana: y === 2016 ? "design intern" : y === 2017 ? "former intern" : "it reporter",
    kim: y <= 2017 ? "building guard" : "retired",
    grace: "investor",
  }[k];
}

// Seven time points: March 15 at 22:50 by radio, 2026 in person.
export const ERAS: Era[] = ["2015", "2016", "2017", "2018", "2019", "2025", "2026"];
export const ERA_NOTE: Record<Era, string> = {
  "2015": "year one, prototype all-nighter",
  "2016": "33 minutes before",
  "2017": "first memorial, ken's last shift",
  "2018": "second memorial, hannah's first article",
  "2019": "third memorial, fellowship prep",
  "2025": "ninth memorial, after hannah finds the contract",
  "2026": "present",
};
export const timepointOf = (era: Era) => `T${era}`;

// Portrait looks: 2016 covers 2015-2016, mid covers 2017-2019, 2026 covers 2025-2026.
const lookOf = (era: Era): Look => (era <= "2016" ? "2016" : era <= "2019" ? "mid" : "2026");
export function portraitSrc(k: PersonId, era: Era): string | null {
  const p = PEOPLE[k];
  const look = lookOf(era);
  const use: Look | null = p.face[look] ? look : look === "mid" && p.face["2016"] ? "2016" : null; // Ken has no mid look
  return use ? `/assets/portraits/${p.img}_${use}_${p.face[use]}.webp` : null;
}

// Who is where (case.json positions). "@" marks a place outside the office, named by the person.
export const POS: Record<Era, Partial<Record<PersonId, string>>> = {
  "2015": { jisoo: "dev_floor", minjae: "dev_floor", dohyun: "ceo_room", kim: "lobby" },
  "2016": { jisoo: "dev_floor", hana: "dev_floor", kim: "lobby", dohyun: "@home", minjae: "@home", grace: "@home" },
  "2017": { dohyun: "lounge", minjae: "lounge", hana: "lounge", kim: "lobby" },
  "2018": { dohyun: "lounge", hana: "lounge", minjae: "@nova office" },
  "2019": { dohyun: "ceo_room", minjae: "lounge", hana: "lounge" },
  "2025": { dohyun: "lounge", hana: "lounge", minjae: "@nova hq" },
  "2026": { dohyun: "@moonlight hq", minjae: "@nova hq", hana: "@newsroom", kim: "@ken's home", grace: "@vc office" },
};
export const isHere = (k: PersonId, era: Era) => k in POS[era];

export interface Place {
  key: string;
  lbl: string;
  sub: string;
  people: PersonId[];
}
const ROOMS: [string, string][] = [["dev_floor", "dev floor"], ["ceo_room", "ceo room"], ["server_room", "server room"], ["lounge", "lounge"], ["lobby", "lobby · security desk"]];
const SUB26: Record<string, string> = { "moonlight hq": "pangyo · a unicorn now", "nova hq": "the competitor", newsroom: "it desk", "ken's home": "retired, wants to talk", "vc office": "keeps her last email" };

// Places of a year: five office rooms + elsewhere (radio years), or the 2026 places + evidence storage.
export function placesOf(era: Era): Place[] {
  const pos = POS[era];
  const at = (place: string) => (Object.keys(pos) as PersonId[]).filter((k) => pos[k] === place);
  const away = [...new Set(Object.values(pos).filter((v): v is string => !!v && v[0] === "@"))];
  if (era === "2026") {
    return [
      ...away.map((pl) => ({ key: pl.slice(1), lbl: pl.slice(1), sub: SUB26[pl.slice(1)] ?? "", people: at(pl) })),
      { key: "evidence storage", lbl: "evidence storage", sub: "case 2016-0315, boxed since 2016", people: [] },
    ];
  }
  return [
    ...ROOMS.map(([id, lbl]) => ({ key: id, lbl, people: at(id), sub: id === "server_room" ? "deploy-bot logs live here" : "" })),
    ...(away.length ? [{ key: "elsewhere", lbl: "elsewhere", sub: away.map((v) => v.slice(1)).join(" · ") + " · by radio", people: away.flatMap(at) }] : []),
  ];
}

// Each place zooms into its own part of the existing background art: [image, x%, y%, zoom].
// zoom is the art's height relative to the card, so 300 shows about a third of the picture.
const ART: Record<string, [string, number, number, number]> = {
  dev_floor: ["bg_office_2016", 10, 58, 280], ceo_room: ["bg_office_2016", 78, 36, 380], server_room: ["bg_server_hall", 30, 42, 190],
  lounge: ["bg_office_2016", 52, 30, 380], lobby: ["bg_office_2016", 90, 32, 420], elsewhere: ["bg_seoul_2026", 72, 46, 240],
  "moonlight hq": ["bg_seoul_2026", 24, 34, 320], "nova hq": ["bg_seoul_2026", 46, 36, 340], newsroom: ["bg_office_2016", 34, 46, 320],
  "ken's home": ["bg_seoul_2026", 94, 46, 380], "vc office": ["bg_office_2016", 64, 24, 420], "evidence storage": ["bg_evidence_room", 40, 58, 220],
};
// --azr: rooms are taller boxes, so less zoom shows the same part
export function artStyle(key: string): CSSProperties {
  const a = ART[key];
  return a
    ? ({ "--art": `url("/assets/bg/${a[0]}.webp")`, "--ax": `${a[1]}%`, "--ay": `${a[2]}%`, "--az": `auto ${a[3]}%`, "--azr": `auto ${Math.max(140, (a[3] * 0.55) | 0)}%` } as CSSProperties)
    : {};
}

// Record cards: found by searching a place, only after visiting `from` or later on the radio.
export type RecordId = "report" | "parking" | "door" | "taxi" | "messenger";
export interface RecordCard { title: string; line: string; icon: string; from: Era | null }
export const RECORDS: Record<RecordId, RecordCard> = {
  report: { title: "Incident report (Mar 16, 2016)", line: "Server-rack cover found open. Log-server disk missing. No witness statements filed.", icon: "report", from: null },
  parking: { title: "Parking barrier log", line: "Mar 15, 21:10: Daniel Kang's car exits. No re-entry that night.", icon: "parking", from: "2017" },
  door: { title: "Server-room door log", line: "Mar 15, 22:40: opened with the shared admin card.", icon: "door_log", from: "2018" },
  taxi: { title: "Taxi app receipt", line: "Mar 15, 23:06: Hannah Yoo picked up at the front entrance.", icon: "taxi_app", from: "2018" },
  messenger: { title: "Messenger backup (found 2019)", line: "Mar 15, 19:02 Julia: 'Was the deploy-bot push on the 13th you?' 19:05 Marcus: 'No idea.'", icon: "messenger_backup", from: "2019" },
};
// Search spots per place: [record, x%, y%].
export const SPOTS: Record<string, [RecordId, number, number][]> = {
  lobby: [["parking", 62, 50]], server_room: [["door", 66, 46]], ceo_room: [["messenger", 58, 50]],
  "evidence storage": [["report", 46, 52]], newsroom: [["taxi", 60, 50]], "moonlight hq": [["messenger", 55, 48]],
};

// Evidence slots and the fact ids that fill them; rec = the record card that also fills it.
export interface Evidence { icon: string; title: string; refs: string[]; always?: boolean; rec?: RecordId }
export const EVIDENCE: Evidence[] = [
  { icon: "radio", title: "The radio", refs: [], always: true },
  { icon: "report", title: "Incident report", refs: ["F25"], rec: "report" },
  { icon: "parking", title: "Parking barrier", refs: ["F09", "F48"], rec: "parking" },
  { icon: "door_log", title: "Server-room door log", refs: ["F26"], rec: "door" },
  { icon: "taxi_app", title: "Taxi app", refs: ["F57"], rec: "taxi" },
  { icon: "messenger_backup", title: "Messenger backup", refs: ["F52"], rec: "messenger" },
  { icon: "deploy_log", title: "deploy-bot log", refs: ["F04", "R03"] },
  { icon: "email", title: "Last email", refs: ["F13"] },
  { icon: "envelope", title: "Envelope", refs: ["F24"] },
  { icon: "hoodie", title: "Gray hoodie", refs: ["F11", "F12"] },
  { icon: "nova_contract", title: "Nova contract", refs: ["F03", "F29"] },
  { icon: "terms", title: "Signing terms", refs: ["F06"] },
  { icon: "escrow", title: "Escrow folder", refs: ["F21"] },
  { icon: "hospital_bill", title: "Hospital bill", refs: ["F28"] },
];
export const itemSrc = (icon: string) => `/assets/items/${icon}.webp`;
