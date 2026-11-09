// Briefing: the case, the two time rules and how to play. The first time it plays as a typewriter scene;
// any click, Space or Enter shows everything. From the menu it opens fully shown.
import { useEffect, useRef } from "react";
import { reduced } from "../core/fx";
import { useUi } from "../store/ui";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function BriefScreen() {
  const { go, briefPlayed } = useUi();
  const sec = useRef<HTMLElement>(null);
  const win = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const start = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const parts = [...sec.current!.querySelectorAll<HTMLElement>(".bx")];
    let live = true;
    const finish = () => {
      if (!live) return;
      live = false;
      sec.current?.classList.remove("playing");
      sheet.current?.classList.remove("strike");
      parts.forEach((p) => { p.classList.add("in"); p.classList.remove("typing"); if (p.dataset.full) p.textContent = p.dataset.full; });
      if (win.current) win.current.scrollTop = win.current.scrollHeight;
      start.current?.focus();
    };
    if (reduced || briefPlayed) {
      finish();
      if (win.current) win.current.scrollTop = 0;
      return;
    }
    sec.current!.classList.add("playing");
    parts.forEach((p) => p.classList.remove("in"));
    const feed = setInterval(() => { if (win.current) win.current.scrollTop = win.current.scrollHeight; }, 60);
    const show = async (el: HTMLElement, ms: number) => { if (!live) return; el.classList.add("in"); await wait(ms); };
    const type = async (el: HTMLElement, speed: number) => {
      if (!live) return;
      const full = (el.dataset.full ||= el.textContent ?? "");
      el.classList.add("in", "typing");
      sheet.current?.classList.add("strike");
      for (let i = 1; i <= full.length && live; i++) { el.textContent = full.slice(0, i); await wait(speed); }
      el.classList.remove("typing");
      sheet.current?.classList.remove("strike");
    };
    (async () => {
      const [eyebrow, title, lede, report, radio, now, ...rest] = parts;
      await show(eyebrow, 350); await type(title, 26); await wait(200); await type(lede, 9); await wait(150);
      await show(report, 1100); await show(radio, 300); await show(now, 450);
      for (const p of rest) await show(p, 260);
      finish();
    })();
    const skip = (e: Event) => {
      if (e instanceof KeyboardEvent && !(e.key === " " || e.key === "Enter")) return;
      if (!live) return;
      e.preventDefault();
      finish();
    };
    const el = sec.current!;
    el.addEventListener("click", skip);
    addEventListener("keydown", skip);
    return () => { live = false; clearInterval(feed); el.removeEventListener("click", skip); removeEventListener("keydown", skip); };
  }, [briefPlayed]);

  return (
    <section id="s-brief" ref={sec} className="screen" aria-labelledby="bTitle">
      <div className="wrap">
        <div className="tw-win" ref={win}>
          <div className="tw-sheet" ref={sheet}>
            <div className="b-head">
              <p className="t-eyebrow bx">case briefing · 2016-0315</p>
              <h2 id="bTitle" className="bx">A murder mystery across ten years: question the past by radio, catch the lies, name the killer.</h2>
            </div>
            <p className="b-lede bx">March 15, 2016, 23:23. Julia Han, co-founder and CTO of Moonlight Labs, is found dead in the server room, the night before the startup signs its first big investment. The police call it an electric shock accident and close the case. Ten years later you are a cold-case detective. In the evidence box you find an old radio, and at 23:23 it turns on. Julia answers, 33 minutes before she dies.</p>
            <p className="b-report bx"><b>accident report</b>rack cover open · log server disk missing · no witness statements</p>
            <div className="b-modes">
              <div className="win bx">
                <h3>📻 by radio · 2015–2025</h3>
                <p>Every March 15 at 22:50. Talk to anyone in that year, Julia too. They are honest, but they only know what has happened so far.</p>
              </div>
              <div className="win now bx">
                <h3>🕵️ in person · 2026</h3>
                <p>The survivors, ten years later. Memories have faded, and some of them lie.</p>
              </div>
            </div>
            <ol className="b-steps">
              <li className="bx"><b>Pick a year</b> on the time slider under the map.</li>
              <li className="bx"><b>Click someone</b> on the map and ask them anything.</li>
              <li className="bx"><b>Compare</b> what the same person says in different years. Keep the lies in your memo.</li>
              <li className="bx"><b>Accuse</b> one person. Your memo is read as the motive and scored. You get one try.</li>
            </ol>
          </div>
        </div>
        <div className="typewriter" aria-hidden="true">
          <div className="tw-roller"><i /><i /></div>
          <div className="tw-body"><div className="tw-keys" /><div className="tw-space" /></div>
        </div>
        <button ref={start} className="t-answer b-go bx" onClick={() => go("map")}>
          {briefPlayed ? "Back to the map ▶" : "Start the investigation ▶"}
        </button>
      </div>
      <p className="b-skip" aria-hidden="true">click or press space to skip</p>
    </section>
  );
}
