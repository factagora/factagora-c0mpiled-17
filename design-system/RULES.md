# 11:23 — Readability, UX and Pixel Rules

Story: 「11:23」 (Moonlight Labs, 2016 ↔ 2026). The pixel style comes from the earlier Deck Seven concept; the cruise-ship content is gone.

These rules are written so that a new screen can be built from this document alone. All numbers are in 1920×1080 stage pixels unless stated otherwise.
A bracketed number at the end of a rule points to the sources at the bottom.

---

## 1. Pixel grid

| Rule | Value | Why |
|---|---|---|
| 1 art pixel `--u` | 2 stage px (logical resolution 960×540) | One grid for every dimension keeps line weights consistent |
| Dimensions are whole multiples of `--u` | borders 4/2, spacing 4 · 8 · 16 · 24 · 32 · 48 | Odd sizes (3, 5) alternate between 1px and 2px when the scale changes |
| Screen scale | Web default = fill (max 1×). Option = integer scale (crisp) | Fractional scales blur slightly, but on the web filling the screen is the better default `[1][2]` |
| Leftover space is letterboxed | canvas colour `--c-canvas` | Never stretch the aspect ratio |
| No rounded corners | `--radius-win: 0` | Curves produce translucent edge pixels |
| No blurred shadows | only `box-shadow: 0 2px 0 0` style | Blur does not mix with pixel art |
| Upscaled images use `image-rendering: pixelated` | `.ds img` | Smooth interpolation smears the dots `[2]` |

## 2. Type (web)

Stage pixels shrink with the screen. **Always judge text size by how many browser px it renders at.**
The web default scale is fill (fit) and never exceeds 1×. On monitors wider than 1920px the stage is centered with margins.

| Token | Stage | 1280px browser | 1440px browser | 1920px browser | Use |
|---|---|---|---|---|---|
| `--fs-ui` | **24** | 16 | 18 | 24 | Menus, lists, names, labels, buttons. Minimum for any text that carries information |
| `--fs-hero` | **32** | 21 | 24 | 32 | Dialogue, narration |
| `--fs-display` | **48** | 32 | 36 | 48 | Chapter titles, result screens |
| `--fs-deco` | 16 | 11 | 12 | 16 | Decoration only, never information |

| Rule | Value | Source |
|---|---|---|
| Info text renders at 16 browser px or more | The web body-text floor; close to the PC game guideline (XAG 101: 18px at 1080p) | `[4]` |
| Automatically switch to large text below 16px | Under a 1280px-wide viewport, `stage.js` sets `data-text-auto="large"` (24→32, 32→40) | |
| Offer a text size setting | Standard / Large (`data-text-size="large"`) | GAG: adjustable text size `[5]` |
| Sizes are multiples of 8 | 24 · 32 · 40 · 48 | Half an art pixel, so pixel-font strokes stay even `[1][3]` |
| Build hierarchy with **colour, case and position**, not size | Title = amber + uppercase + 1u tracking. Titles and body share 24 | Fewer steps keep the screen tidy |
| Uppercase for titles only | Body and dialogue in mixed case | All caps removes word shapes and slows reading `[6]` |
| No bold or italic | `font-synthesis: none` | Faux bold smears pixel glyphs. Emphasise with colour |
| Dialogue: ≤ 60 characters per line, ≤ 3 lines per screen | `max-width: 60ch`; 2 lines in large-text mode | Split longer text into the next beat |
| Line height | 1.5 (1.25 for UI in large-text mode) | |
| Korean | Galmuri11 at 24 · 36 · 48 | DotGothic16 has no Hangul. Korean builds use `.ds-ko` |

> Sharpness and size trade off. Setting Screen to **Pixel perfect** (`data-scale="crisp"`) uses integer scaling and sharp text, but on a 1366px screen the stage shrinks to 960×540, large text switches on automatically, and wide black margins appear.

## 3. Colour and contrast

Contrast is measured **worst-case, with a white image behind the window**, because the 86% translucent window background changes with the art behind it `[7]`.

| Use | Token | Worst-case contrast | Requirement |
|---|---|---|---|
| Body | `--c-text` | 13.3 : 1 | ≥ 4.5 |
| Titles, emphasis | `--c-text-title` | 9.3 : 1 | ≥ 4.5 |
| Visited items, secondary info | `--c-text-visited` | 5.4 : 1 | ≥ 4.5 (still selectable, so it counts as important text) |
| Not selectable | `--c-text-disabled` | 3.5 : 1 | ≥ 2.5 `[7]` |
| Contradiction | `--c-danger` | 5.3 : 1 | ≥ 4.5 |
| Remaining progress segments | `--c-line-dim` | 3.7 : 1 | ≥ 3 for UI graphics `[8]` |
| High contrast mode | `data-contrast="high"` | all text ≥ 7 | XAG 101 `[7]` |

- **No opacity on text, lines or marks.** To dim something, use the next colour in the palette. Translucent text let the art show through and dropped contrast to 3.4 : 1 (`opacity .7` in v2).
- Visited portraits use `--fx-visited` (desaturate + darken) instead of opacity.
- Translucency is used in **one place only: window backgrounds**. High contrast mode makes those opaque too.
- **Never signal state with colour alone** `[9]`

| State | Colour | Always paired with |
|---|---|---|
| Selected | amber outline | ▶ cursor |
| Visited | lilac | ✓ |
| Not selectable | dark lilac | — |
| New | amber | ★ NEW |
| Contradiction | red | `!` prefix, dashed border |

## 4. Input

| Rule | Implementation |
|---|---|
| One cursor | Mouse hover and the arrow keys move the same `.is-selected`: ←→ person, ↑↓ question |
| Everything works with the keyboard | ←→ person · ↑↓ question · Enter ask · Y switch year · Space next line · Esc back/cancel · 1–3 ask directly · Tab reaches the case log entries |
| Focus is visible | `:focus-visible` is a 2px amber pixel outline; the browser's blue ring is not used `[8]` |
| Show the keys that work right now | `.keyhints`, updated when the screen changes |
| Minimum target size | 56 stage px or more (list row 56, button 64): 37px in a 1280px browser, above the WCAG 24px target `[8]` |
| Confirm irreversible actions | ACCUSE → `.modal`. State the consequence in a sentence, default focus on **cancel**, Esc = cancel |
| Feedback for every action | A found clue shows a 3-second `.toast` and appears in the case log with an amber border and ★ (`.is-new`) |

## 5. Dialogue

| Rule | Implementation (`dialog.js`) | Source |
|---|---|---|
| First input completes the line, the second shows the next one | `advance()` | Reading speed varies by person |
| Three text speeds: slow 45ms · normal 25ms · instant | `data-text-speed` | `[5]` |
| Always show who is speaking | Name tab. Narration shows CASE FILE (lilac) | Speaker identification `[10]` |
| Solid background behind dialogue | 86% window, 100% in high contrast mode | `[10]` |
| ▼ only when the line is complete | Hidden while `.is-typing` | Tells the player when input is expected |
| Screen readers get the whole line at once | `aria-live="polite"` | Not read letter by letter |
| Clues in amber, contradictions in red with a dashed underline | `<em>` · `<del>` | Colour + shape |

## 6. Motion

- Motion is stepped (`steps()`). Smooth easing does not suit pixel art.
- Blinking runs on a 1.2s cycle (0.83Hz), never 3 or more flashes per second `[8]`.
- With `prefers-reduced-motion`, the ▼ blink and ▶ nudge stop.

## 7. Characters

Character designs are not final. The design system defines only the portrait **frame**: sizes (120 / 96 / 360), border, and states (visited, selected). Without art, a portrait shows a checkerboard placeholder with an initial (`data-initial`). Everyone except Jisu needs two portraits: 2016 (younger) and 2026 (older).

## 8. New screen checklist

- [ ] Does all info text render at 16px or more in a 1280px browser (stage ≥ 24, multiple of 8)?
- [ ] Is there no `opacity` or rgba on text and lines?
- [ ] Is every new colour added to the palette, with its worst-case contrast measured and recorded?
- [ ] Does every state come with a mark or a word?
- [ ] Can the screen be completed with the keyboard alone, and do the key hints match?
- [ ] Do irreversible actions have a confirmation?
- [ ] Are all dimensions multiples of 2px?

---

### Sources
1. Coding Horror, *Font Rendering: Respecting The Pixel Grid* — bitmap fonts are only sharp when aligned to the pixel grid
2. MDN, `image-rendering` — `pixelated` scales by nearest neighbour to an integer multiple, then interpolates
3. Phaser forum, *Text becomes blurry on scaling* — scaling a low-resolution canvas by a fractional factor blurs text
4. Microsoft, Xbox Accessibility Guideline 101: Text display — at 1080p, at least 26px on console and 18px on PC
5. Game Accessibility Guidelines, *Use an easily readable default font size* — 28px is a minimum, not a target
6. Game Accessibility Guidelines / XAG 104 — subtitles in mixed case
7. Microsoft, Game Publishing Guide: Accessibility metadata — important text 4.5:1, disabled 2.5:1, high contrast mode 7:1; verify semi-opaque backgrounds against the lightest possible background
8. W3C, WCAG 2.2 — 1.4.11 non-text contrast 3:1, 2.4.7 and 2.4.13 focus, 2.5.8 target size 24px, 2.3.1 three flashes
9. Game Accessibility Guidelines — do not convey information by colour alone
10. Microsoft, XAG 104 / publishing criteria — speaker identification and a solid background for subtitles
