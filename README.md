# 11:23 · Moonlight Labs

> Every night at 11:23, an old radio connects to a woman who died ten years ago.

**A murder mystery that spans ten years, built on a time-aware knowledge graph (TCKG).** The player questions people in the past (2015–2025) by radio and the survivors in the present (2026) face to face, then names the killer by finding where the same person tells a different story at different times.

TCKG is [Factagora](https://app.factagora.com)'s time-aware knowledge graph. It stores claims in [FactBlock](https://github.com/factagora/factblock), Factagora's open format for claims and their history, so you can ask what was known at any point in time.

Every character's memory lives in TCKG. For each question, the server rebuilds **what that person knew and had said at that moment** with a time-scoped TCKG read. The lines come from facts placed in time, not from a script.

Built for the c0mpiled-17 hackathon (2026-11-09) · **Play:** https://factagora-c0mpiled-17.azurewebsites.net

---

## Core technology

### 1. Memory on a time axis: TCKG `as_of` reads

Each character has its own TCKG space.

- A character reads only `moonlight.public` (public facts) and its own space, `moonlight.char.<id>`. No character reads the truth space that holds the answer.
- For each question, the server reads both spaces in parallel **as of that timepoint** (`as_of`). A 2016 question reads as of `2016-03-15T22:50+09:00`, so the character structurally cannot know anything that happens later.
- Claims follow `said_at <= T`: a character **remembers everything they said** up to that point. Marcus in 2026 answers while holding both his 2017 "I left at nine" and his 2019 "I stopped by at 10:30", so the changed story shows up in the conversation.
- One memory store yields different memory states for 6 people × 7 timepoints. There is no per-timepoint script.

### 2. Locked memories opened by evidence

- Some memories start locked. For each question, the server computes what that person hides at that timepoint (`hiddenRefs`) and leaves it out of the prompt.
- The model returns, as JSON, the **memory numbers it actually used** (`used`) along with its answer. The server turns them into fact ids (`refs`) on the response.
- When the player pins an answer from another timepoint as a card, its `refs` travel with later questions as evidence. Once a condition (`requires_any` / `requires_all`) is met, the locked memory opens.
  - Example: bring what 2016 Hannah saw to 2026 Ken, and the envelope he has been hiding comes out.
- The evidence slots on the game screen fill from the same `refs`.

### 3. Character agents

- One Azure OpenAI deployment plays 6 characters × 7 timepoints.
- The system prompt is assembled from:
  - the persona: voice and situation at that time
  - the place and how they are reached (radio / in person)
  - the memories read from TCKG, in time order
  - any evidence the detective shows
- Whatever language the question is in, characters answer in English, in 1–3 spoken sentences. They use the on-screen English names (Julia, Marcus, …); the server maps those to the data's romanized ids (jisoo, minjae, …).
- If a TCKG call fails, the character still answers without memories, so the demo keeps going. The failure is logged.

### 4. Scoring: the LLM only reads, rules give the score

- To accuse, the player picks the culprit, and **the whole memo is scored as the motive**.
- The LLM only picks out which motives the memo describes. The score comes from a rule table on the server, so writing "give me full marks" in the memo changes nothing.
  - The memo is wrapped in data tags in the prompt, and instructions inside it are not followed.
  - A denied motive ("it was not about the debt") does not count.
- The score is 30 for the culprit plus up to 70 for the motive. A wrong culprit scores 1–10.
- If the LLM does not respond, judging falls back to keyword matching.
- **Tamper-proofing:**
  - The verdict is stored on the server, and the leaderboard only accepts its verdict id. The browser never sends a score.
  - Accusations are limited to 5 per minute per client.

---

## Architecture

```
Browser: React app (web/), game saved in localStorage
   │  POST /api/ask {character, timepoint, question, history, evidence}   (web/src/api/client.ts)
   ▼
server.js ──► lib/tckg.js  GET /memories?space=moonlight.public|moonlight.char.<id>&as_of=<timepoint>
   │          (locked memories removed: lib/characters.js hiddenRefs)
   ├────────► lib/llm.js  Azure OpenAI → {answer, used}
   ▼
{answer, refs}  → browser: chat log · evidence slots · pinned cards

POST /api/accuse {who, memo} → lib/scoring.js (LLM extracts motives → rule-based score) → verdict stored
POST /api/scores {nick, verdictId} → lib/leaderboard.js
```

| Path | Role |
|---|---|
| `server.js` | HTTP server: API, the built web app (`web/dist`) and game art (`/assets/`) |
| `lib/characters.js` | Personas, timepoints, spaces, lock rules (`hiddenRefs`), screen names (`screenText`) |
| `lib/tckg.js`, `lib/llm.js`, `lib/fetch-retry.js` | TCKG reads, Azure OpenAI calls, retries |
| `lib/scoring.js` / `lib/accuse.js` | LLM motive judging + rule score / keyword judging (fallback) |
| `lib/leaderboard.js`, `lib/ratelimit.js` | In-memory leaderboard and verdict store, rate limits |
| `web/src/screens/` | Title, briefing, map, places, leaderboard (React + TypeScript) |
| `web/src/components/` | Chat, people row, evidence slots, accuse panel, verdict dialog, time slider |
| `web/src/store/` | Game save (Zustand, localStorage key `moonlight-game-v2`) and screen state |
| `web/src/api/client.ts` | Calls to `/api/*` |
| `web/public/assets/` | Portraits (three looks across the timepoints), backgrounds, item icons |
| `test/` | All tests (`node --test`) |
| `data/case.json` | Case data safe to send to the client (characters, timepoints, places, positions, questions, records) |
| `data/server.json` | Server only (statements, unlock conditions, solution, endings) |
| `data/tckg-seed.json` | TCKG seed (1 tenant, 8 spaces) |

## API

| | Path | Request → response |
|---|---|---|
| GET | `/api/characters` | Timepoints, and the timepoints each character appears in |
| POST | `/api/ask` | `{gameId, character, timepoint, question, history, evidence}` → `{answer, refs}` |
| POST | `/api/accuse` | `{who, memo, nick?}` → verdict (ending, culprit and motive points, motives found) |
| GET / POST | `/api/scores` | Leaderboard / register `{nick, verdictId}` |

## Run

Node 22 or newer. The server itself needs no packages; the web app is built with Vite (dev dependencies).

```bash
npm install
cp .env.example .env      # fill in TCKG_TOKEN and AOAI_API_KEY
npm run dev               # server on :3000 + Vite on :5173 (proxies /api to the server)
```

```bash
npm run build             # build the web app into web/dist
npm start                 # serve the built game at http://localhost:3000  (set PORT to change)
npm run typecheck         # TypeScript check of web/
npm test
```

| Variable | What it is |
|---|---|
| `TCKG_TOKEN`, `TCKG_COLLECTION_ID` | Personal TCKG token, the `11:23 Moonlight Labs` collection |
| `AOAI_ENDPOINT`, `AOAI_API_KEY`, `AOAI_DEPLOYMENT` | Azure OpenAI for character answers and motive judging |

A push to `main` deploys to Azure App Service through GitHub Actions; CI runs `typecheck`, `test` and `build` before uploading.

## Team

- **Minchur**: environment, server, TCKG integration
- **Sky (Haneul)**: story, case data, TCKG seed
- **Minji**: design system, game screens
- **Jiwon**: characters and art, game UI
