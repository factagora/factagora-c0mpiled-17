// A person's portrait for a year, over a drawn placeholder with initials (shown only if the image fails).
// On a year change the next look is decoded first, then fades in over the old one (delay staggers a row).
import { useEffect, useState } from "react";
import { type Era, type PersonId, PEOPLE, portraitSrc } from "../core/data";
import { reduced } from "../core/fx";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ready = loaded, then decoded (capped at 250ms so a stalled decode never blocks the swap)
function ready(src: string): Promise<unknown> {
  const img = new Image();
  img.src = src;
  const loaded = img.complete ? Promise.resolve() : new Promise((r) => { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); });
  return loaded.then(() => Promise.race([img.decode().catch(() => {}), wait(250)]));
}

// the fading image starts at opacity 0; a reflow before adding "on" makes the transition run
function fadeIn(el: HTMLImageElement | null) {
  if (el?.classList.contains("next")) { void el.offsetWidth; el.classList.add("on"); }
}

export function Portrait({ who, era, delay = 0 }: { who: PersonId; era: Era; delay?: number }) {
  const p = PEOPLE[who];
  const src = portraitSrc(who, era);
  const [shown, setShown] = useState(src);
  const [next, setNext] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    // back on the look already shown (fast scrubbing): cancel any pending or half-faded swap
    if (src === shown) { setNext(null); return; }
    if (!src || !shown) { setShown(src); return; }
    let live = true;
    let timer = 0;
    ready(src).then(() => {
      if (live) timer = window.setTimeout(() => (reduced ? setShown(src) : setNext(src)), reduced ? 0 : delay);
    });
    return () => { live = false; clearTimeout(timer); };
  }, [src, shown, delay]);

  // fallback if transitionend never fires
  useEffect(() => {
    if (!next) return;
    const t = setTimeout(() => setShown(next), 700);
    return () => clearTimeout(t);
  }, [next]);

  const art = !!shown && failed !== shown;
  return (
    <div className={"ph" + (art ? " art" : "")} style={{ "--hair": p.hair, "--suit": p.suit } as React.CSSProperties}>
      {p.ini}
      {art && (next && next !== shown ? [shown, next] : [shown]).map((s) => (
        <img key={s} ref={fadeIn} src={s} alt="" decoding="async" className={s === shown ? undefined : "next"}
          onError={() => setFailed(s)} onTransitionEnd={s === shown ? undefined : () => setShown(s)} />
      ))}
    </div>
  );
}
