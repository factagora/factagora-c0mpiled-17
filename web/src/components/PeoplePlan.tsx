// The six people on the map for the current year. People not there that year are grayed out and cannot be asked.
import { useEffect, useState } from "react";
import { ERA_NOTE, ORDER, PEOPLE, isDead, isHere, roleOf } from "../core/data";
import { reduced } from "../core/fx";
import { useUi } from "../store/ui";
import { Portrait } from "./Portrait";

// the role line fades out, changes, and fades back in when the year changes
function Note({ text }: { text: string }) {
  const [shown, setShown] = useState(text);
  const [swap, setSwap] = useState(false);
  useEffect(() => {
    if (text === shown) { setSwap(false); return; }
    if (reduced) { setShown(text); return; }
    setSwap(true);
    const t = setTimeout(() => setShown(text), 160);
    return () => clearTimeout(t);
  }, [text, shown]);
  return <span className={"note" + (swap ? " swap" : "")}>{shown}</span>;
}

export function PeoplePlan() {
  const { era, person, visited, openTalk } = useUi();
  const now = era === "2026";
  return (
    <>
      <div className="phead">
        <span className="wtitle">{now ? "Seoul · 2026" : "Moonlight Labs · Pangyo"}</span>
        <span className="muted">{now ? `2026 · ${ERA_NOTE[era]}` : `${era}-03-15 · 22:50 · ${ERA_NOTE[era]}`}</span>
      </div>
      <div id="plan" className={"plan" + (now ? " y26" : " radio")}>
        {ORDER.map((k, i) => {
          const here = isHere(k, era);
          const dead = isDead(k, era);
          const p = PEOPLE[k];
          return (
            <div key={k} className={"cell slot" + (dead ? " dead" : here ? "" : " away")}>
              <button
                className={"pol" + (dead ? " dead" : here ? "" : " away") + (person === k ? " sel" : "")}
                disabled={!here}
                aria-label={here ? "question " + p.name : dead ? `${p.name} died on ${p.died}` : `${p.name} is not here in ${era}`}
                onClick={() => { openTalk(k); document.getElementById("chatInput")?.focus({ preventScroll: true }); }}
              >
                <Portrait who={k} era={era} delay={i * 45}>{dead && <span className="died">† {p.died}</span>}</Portrait>
                <span>{p.short}</span>
                {here && !visited.includes(k + era) && <span className="new">★ NEW</span>}
              </button>
              <Note text={here ? roleOf(k, +era) : dead ? "\u00a0" : `not in ${era}`} />
            </div>
          );
        })}
      </div>
    </>
  );
}
