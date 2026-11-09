# Steps 2–5 · Loop, flow, screens, specs

Built on `design-system/` (11:23 DS v5, the Deck Seven pixel style re-themed) and `docs/ux/01-premise.md`. Story source: the Notion page "해커톤 스토리라인 작성".
S1 is built and playable as the main screen of `design-system/index.html`.
All sizes are 1920×1080 stage px. Screen text is English. Class names refer to `design-system/components.css`.

---

## 1. Core loop

```
pick person ──► pick year (2016 / 2026) ──► ask (preset or free text)
     ▲                                              │
     │                                              ▼
     └──── Case Log sidebar: pick 2 ◄── answer + new log entry (toast, ★)
                  │
                  ▼
           red line (contradiction)  ──►  …  ──►  Accuse
```

The hook: the same person says different things when you flip the year. The player catches it with their own hands, and that is the red-line moment.

## 2. User flow

```
S0 Intro ──Enter──► S1 Investigation (hub, 2016, Jisu selected)
                         │  ⇄ Tab: 2016 / 2026
                         │  G ► S2 Graph (overlay) ── Esc ► S1
                         │  A ► S3 Accuse: suspect ► motives ► confirm modal
                         ▼
                    S4 Verdict ──Enter──► S5 Final Call
                                             ├─ right + ≥50 ► S5a Saved (team photo)
                                             └─ otherwise   ► S5b Line dead
                    (reload = start over)
```

## 3. Screen list and priority

| ID | Screen | Priority | Demo time | Built from |
|---|---|---|---|---|
| S1 | Investigation (hub) with case log sidebar | P0 | 10–55s | `layout-main` (re-themed), `.person`, `.ask`, `.log__entry` |
| S2 | Graph (timeline with red lines) | P0 | 55–70s | New window, `.clue`, new timeline + line |
| S3 | Accuse (suspect → motives → modal) | P0 | 70–80s | `.choice`, `.portrait`, `.modal` |
| S5 | Final Call + endings | P0 | 80–90s | `dialog-window`, new photo frame |
| S0 | Intro | P1 | 0–10s | `dialog-window` + narration tab |
| S4 | Verdict | P1 | (inside 70–80s) | `--fs-display`, `.tag`, `.segments` |

If time runs out: S4 folds into the first beat of S5 (the score shows in the dialog box), and S0 becomes three narration lines on S1.

### Layout follows the Notion page
The Notion page puts the case log in a sidebar ("사이드바 사건 기록") and shows contradictions as red lines in a graph. So the hub keeps the log on the right at all times, and the graph is a separate full-screen view.

---

## 4. Screen specs

### S1 · Investigation (hub)

Built: `design-system/index.html`, first screen. Grid: 48 + 1176 + 32 + 616 + 48 = 1920; rows 40 + 112 + 24 + 248 + 24 + 296 + 56 + 232 + 48 = 1080.

```
┌─ hud-window 1176×112 ─────────────────────────────────────┐            ┌ Graph | Accuse ┐
│ MAR 15, 2016  22:50                      [▶2016] [ 2026 ] │            └────────────────┘
│ Moonlight Labs · Radio                                    │  ┌─ CASE LOG 3 ───────────────┐
└───────────────────────────────────────────────────────────┘  │ 21:00 Minjae · 2026        │
┌─ people-window 248 ───────────────────────────────────────┐  │       "I left at nine."    │
│  [J]★    [D]     [M]      [H]★     [K]      [G]           │  │!22:30 Kim · 2026  (red,    │
│  Jisu    Dohyun  Minjae   Hana     Kim      Grace         │  │       dashed) Minjae asked │
│  CTO     CEO     LEAD DEV INTERN   GUARD    INVESTOR      │  │       to cut the CCTV      │
└───────────────────────────────────────────────────────────┘  │▶22:50 Minjae · 2016        │
┌─ ask-window 296 ──────────────────────────────────────────┐  │       "I'm home."          │
│ ▶1 Where are you right now?                            ✓  │  │                            │
│  2 Who has the deploy-bot key?                            │  │                            │
│  3 How's the team tonight?                                │  │                            │
│ [ Ask anything…                                 ] [ASK]   │  │ Pick 1 more [Contradiction?]│
└───────────────────────────────────────────────────────────┘  │ log-window 616×852         │
  ┌ MINJAE · 2016 ┐                                            │                            │
┌─┴─ dialog-window 1176×232 ────────────────────────────────┐  │                            │
│ I'm home. Getting the demo ready for tomorrow.         ▼  │  └────────────────────────────┘
└───────────────────────────────────────────────────────────┘
                              ←→ Person  ↑↓ Question  Enter Ask  Y Year  A Accuse
```

**HUD**: date/time and place on the left, year switch (`.stepper`, `Y`) on the right.
- 2016 → `MAR 15, 2016  22:50` / `Moonlight Labs · Radio` (fixed at 33 minutes before the death, as in the Notion page).
- 2026 → `NOV 9, 2026  23:23` / `Cold Case Unit · Seoul`.

**Menu**: `Graph | Accuse`.

**People** (`.person`): portrait 96, one status mark top-right (★ new · ✓ all asked · — unavailable), name, role in that year.

| Person | 2016 role | 2026 role |
|---|---|---|
| Jisu | CTO | Deceased (`.is-disabled`, dashed, cannot be picked) |
| Dohyun | CEO | Unicorn CEO |
| Minjae | Lead dev | Nova AI CEO |
| Hana | Design intern | IT reporter |
| Kim | Guard | Retired |
| Grace | Investor | Investor |

**Questions**: 3 preset `.choice` rows (✓ once asked) and the `.ask` free-text input. No title: the selected person and the dialogue name tab already say who is asked. No question counter.

**Dialogue**: name tab `Minjae · 2016`. Clue words in `<em>` (amber), known lies in `<del>` (red dashed). Long replies split into ≤ 3-line beats.

**Case log sidebar** (`.log__entry`)
- Each answer that carries a clue adds an entry: time it talks about, `who · year heard`, one line. Sorted by the time it talks about, so 2016 and 2026 statements about the same night sit next to each other.
- New entry: amber border + toast `★ NEW Case log: …` at the top of the stage.
- Pick two (click or Enter, ▶ + amber outline), then `Contradiction?` (disabled with — until two are picked).
- Correct pair: both entries turn red and dashed with `!`, toast `! Contradiction Minjae · 2026 vs Kim · 2026`, and the pair is drawn as a red line in S2. Wrong pair: toast `No conflict.`, picks clear.

**Year switch**: the selected person stays (Jisu falls back to Dohyun), the stage colour changes. Flat colours until the 2016 office and 2026 cold-case desk art exist.

### S2 · Graph

Full-stage `.win.win--solid` over S1, from the menu `Graph`; `Esc` closes. This is the demo highlight: the red lines.

```
┌─ GRAPH ─────────────────────────────── Contradictions 1/3 ───────────────── Esc Close ┐
│            SAID IN 2016 (RADIO)          TIME        SAID IN 2026                    │
│                                       │ EARLIER│                                     │
│  [J] Jisu: Minjae built the first     │        │                                     │
│      prototype                        │ 21:00  │  [M] Minjae: "Left at nine."   ◄──┐ │
│                                       │ 22:30  │  [K] Kim: Minjae asked to      ◄──┘ │
│                                       │        │      cut the CCTV  ! red dashed line│
│  [M] Minjae: "I'm home."  ────────────┼ 22:50 ─┼──────────────────────────────►  red │
│                                       │ 23:00  │  [G] Grace: last email               │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

- Vertical time spine in the middle; left lane = heard in 2016, right lane = heard in 2026. Cards (`.clue`) sit on the row of the time they talk about.
- Time rows: `EARLIER` (2015 – Mar 14) · `21:00` · `21:10` · `22:30` · `22:45` · `22:50` · `23:00` · `23:20` · `LATER`.
- Found contradictions are red dashed elbow lines (SVG, 4px `--c-danger`, square caps), drawn in steps. `F09` carries `✓ Alibi`.
- Read-only: picking happens in the sidebar. Opening the graph right after a correct pair is the demo beat at 55s.
- Correct pairs: Minjae 2026 "left at nine" or Minjae 2016 "I'm home" ↔ Kim 2026 F10 · Dohyun 2026 "never fought" ↔ Dohyun 2016 / Hana 2016 F08 · Grace 2026 "nothing seemed wrong" ↔ Grace 2016 F21.

### S3 · Accuse

Three beats on one overlay (`.win.win--solid`, title changes per beat). `Esc` goes back one beat.

**3-1 Who** — title `WHO KILLED HAN JISU?`
- 5 `.portrait--lg`-sized cards in a row (Dohyun, Minjae, Hana, Kim, Grace) with their 2026 role. ←→ move, Enter picks.

**3-2 Why** — title `WHY?` · sub line `Pick up to 3.`
- A `.choice` list of 6 motive statements. Each true motive unlocks only when its supporting clues are in the case log; locked rows are `.is-disabled` with `—` and the text `Find more evidence`.

| Statement | Points | Unlocked by |
|---|---|---|
| Jisu was about to tell the investor about the code leak | 50 | F03 + F13 |
| He would lose his options and be sued | 30 | F06 (+ F03) |
| He built the first prototype, Jisu got the credit | 20 | F01 + F02 |
| Jisu caught him inflating user numbers | 0 | F07 |
| He wanted to stop the deal for the fund | 0 | F21 |
| He was jealous of Jisu's press coverage | 0 | F02 |

- Picked rows get `✓` and amber; a 4th pick is refused with a toast `Pick up to 3`.
- `Continue` (`.btn--primary`).

**3-3 Confirm** — DS `.modal` as is: `Accuse Oh Minjae?` / `You can't take this back.` / `Not yet` (default focus) · `Accuse` (danger).

### S4 · Verdict

```
                         CASE CLOSED                 (--fs-display, amber)

        CULPRIT    Oh Minjae                ✓ Correct        (or ! Wrong, red)
        MOTIVE     80 / 100
                   ✓ Exposure to the investor        50
                   ✓ Options and lawsuit             30
                   — First prototype                  0

                                   [ Final call ▶ ]
```
- Score bar = `.segments` with 10 cells (each 10 points).
- No retry button. Reload starts over.

### S5 · Final Call

Same dialogue grammar as S1, background dark, only the dialogue box and the questions window.
1. HUD `MAR 15, 2016  23:20`. Jisu: `Seojin? I'm heading to the server room. Need to check something.`
2. Questions window shows a single `.choice`: `Don't go. It's <accused name>.` (filled from S3). Enter sends it.
3. Branch:
   - **S5a Saved** (right culprit and ≥ 50): radio cuts, the evidence box on the desk disappears (stepped), then Moonlight Labs' 2026 team photo online, Jisu smiling in the middle (Notion epilogue). Narration: `Case 2016-0315: no record found.`
   - **S5b Line dead** (otherwise): narration `*a door opens*`, static, the radio switches off. `--fs-display` `23:23` in red, then `THE LINE WENT DEAD`.

### S0 · Intro

- Black stage, `--fs-display` `11:23` blinking at the DS 1.2s cycle.
- `CASE FILE` narration beats (Space/Enter):
  1. `2026. Cold Case Unit, Seoul.`
  2. `Evidence box: HAN JISU. Died 2016-03-15, 23:23. Accident.`
  3. `There's a dead radio inside. It just turned on.`
- Then Jisu (2016): `…Hello? Nobody uses this channel. Who is this?` → S1 opens in 2016 with Jisu selected.

---

## 5. Design system status

Done in `design-system/` (v5):
- Cruise content removed: deck map, ship hull, ship background, mock-up portrait sheet, `◆` question cost and `.gems`.
- New: `.people`/`.person`, `.ask`, `.log`/`.log__entry`, `.clue.is-picked`, hub grid tokens, `--c-scene-2016/2026`, `dialog.say()`.

Still to build:
| Need | Plan |
|---|---|
| Graph view (S2) | Time spine + lanes + SVG red line |
| Accuse beats (S3), verdict (S4), final call (S5), intro (S0) | From existing parts, see specs |
| Photo frame (ending) | New, 2px border |
| Backgrounds | 2016 office at night, 2026 cold-case desk |
| Portraits | 11 (Jisu 2016 only, everyone else ×2) |

## 6. Notes for the backend teammate
- The dialogue box fits ≤ 60 characters × 3 lines. Replies longer than ~180 characters are split into beats on the front end, so short replies read best.
- The screens need, per reply, the clue IDs it revealed. Without IDs, free-text answers cannot add cards.
- Statements in the case log need: speaker, year heard, time talked about, one-line text.
