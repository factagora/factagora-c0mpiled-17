// Dialogue window controller
//   const d = createDialog(document.querySelector(".dialog-window"), lines);
//   lines: [{ speaker: "Minjae · 2026", text: "I left <del>at nine</del>." }, ...]
//   Without a speaker the line is shown as narration (CASE FILE).
//   d.say(lines) replaces the queue and shows its first line (e.g. a new answer).
// Rules
//   · First input (click, Enter, Space) completes the current line; the second shows the next line
//   · Speed follows <html data-text-speed="slow|normal|instant">
//   · ▼ shows only on a fully shown line (hidden while .is-typing)
//   · Screen readers get the whole line once via aria-live (not letter by letter)

const speedMs = () => {
  const key = document.documentElement.dataset.textSpeed || "normal";
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--type-${key}`);
  return parseFloat(v) || 0;
};

// Split HTML into characters and tags (tags are inserted whole)
const tokenize = (html) => html.match(/<[^>]+>|&[a-z]+;|[\s\S]/gi) || [];

export function createDialog(win, lines, { onEnd } = {}) {
  const textEl = win.querySelector(".dialog__text");
  const tabEl = win.querySelector(".name-tab");
  const live = document.createElement("span");
  live.className = "sr-only"; live.setAttribute("aria-live", "polite");
  Object.assign(live.style, { position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)" });
  win.append(live);

  let i = -1, tokens = [], shown = 0, timer = null;

  const finish = () => {
    clearInterval(timer); timer = null;
    textEl.innerHTML = tokens.join("");
    win.classList.remove("is-typing");
  };

  const show = (n) => {
    const { speaker, text } = lines[n];
    if (tabEl) {
      tabEl.textContent = speaker || "Case File";
      tabEl.classList.toggle("name-tab--narration", !speaker);
    }
    tokens = tokenize(text); shown = 0;
    live.textContent = `${speaker ? speaker + ": " : ""}${text.replace(/<[^>]+>/g, "")}`;
    const ms = speedMs();
    if (!ms) return finish();
    win.classList.add("is-typing");
    textEl.innerHTML = "";
    timer = setInterval(() => {
      while (shown < tokens.length && tokens[shown].startsWith("<")) shown++;  // skip over tags
      shown++;
      textEl.innerHTML = tokens.slice(0, shown).join("");
      if (shown >= tokens.length) finish();
    }, ms);
  };

  const advance = () => {
    if (timer) return finish();                 // first input: complete the line
    if (i + 1 >= lines.length) return onEnd?.();
    show(++i);                                  // second input: next line
  };

  const say = (next) => { clearInterval(timer); timer = null; lines = next; i = -1; advance(); };

  win.addEventListener("click", advance);
  advance();
  return { advance, say, get typing() { return !!timer; }, get index() { return i; } };
}
