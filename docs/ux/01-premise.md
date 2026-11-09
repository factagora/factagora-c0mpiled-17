# Step 1 · Premise (confirmed)

Source of truth: the Notion page "해커톤 스토리라인 작성" (https://app.notion.com/p/411dc4a92225805cb95ef16ad7499d28). The UX handoff note only fills gaps the Notion page leaves open. Names follow the page's current section: the guard is "Kim" (김씨), the investor is "Grace". The ending line follows the page's epilogue: "Don't go. It's Minjae."

## Who the screens are for
- The main audience is judges (YC and startup people) watching a 90-second video. Almost nobody plays it live.
- Within the first 10 seconds the viewer must get "you talk by radio to a woman who died ten years ago".
- What the demo proves: you question the same person in 2016 and in 2026, put the two answers side by side, and catch the lie. The proof is the red contradiction line.

## Design principles
- One fixed 1920×1080 stage. Minimal scrolling, everything visible at a glance.
- The demo path must give the same result every time. Preset answers and their clues are fixed in data.
- As few screens as possible (5 hours, one frontend person).
- State lives in memory only. A reload starts over.
- The look follows the design system in `design-system/`: the Deck Seven pixel style, re-themed to 11:23 (no cruise content).

## Decisions
| Topic | Decision |
|---|---|
| Asking | 3 preset question chips per character per year, plus a free-text input |
| Question limit | None. No counter |
| Contradictions | The player picks 2 statements in the case log sidebar and presses `Contradiction?`. A correct pair turns both red and draws a red line in the graph; a wrong pair shows `No conflict` |
| Ending threshold | Right culprit and motive score ≥ 50 saves Jisu. The score is shown on its own |
| Hub | One screen, as the Notion page says: people, questions and dialogue on the left, the case log as a sidebar on the right. The graph (red lines) opens full screen from the menu |
| Demo path | Built around the contradiction highlight (below) |
| Data boundary | The backend belongs to a teammate. Screens assume "each answer arrives with clue IDs attached" |

## 90-second demo path
| Time | Beat |
|---|---|
| 0–10s | Intro: 11:23, the radio turns on, Jisu answers |
| 10–25s | Minjae 2016: "I'm home." |
| 25–40s | Switch to 2026. Minjae: "Left at 9." Kim: "10:30, Minjae asked me to cut the CCTV." |
| 40–55s | Pick two statements, `Contradiction?`, red line |
| 55–70s | Hana (F03) and Grace (F13) clues in a fast cut |
| 70–80s | Accuse Minjae, pick motives, score |
| 80–90s | Final call "Don't go. It's Minjae.", team photo with Jisu |

## Data the screens assume (to agree with the backend teammate)
This is only what the screens need in order to be drawn. The teammate decides the real format.
```
ask(character, year, question) → { reply, facts: ["F10"] }

static data:
  characters, presets { question, reply, facts },
  facts, contradictions (correct pairs), motives, scoring
```
