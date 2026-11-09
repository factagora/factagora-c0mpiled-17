// The six people on the map for the current year. People not there that year are grayed out and cannot be asked.
import { ERA_NOTE, ORDER, PEOPLE, isHere, roleOf } from "../core/data";
import { useUi } from "../store/ui";
import { Portrait } from "./Portrait";

export function PeoplePlan() {
  const { era, person, visited, openTalk } = useUi();
  const now = era === "2026";
  return (
    <>
      <div className="phead">
        <span className="wtitle">{now ? "Seoul · 2026" : "Moonlight Labs · Pangyo"}</span>
        <span className="muted">{now ? "where are they now" : `${era}-03-15 · 22:50 · ${ERA_NOTE[era]}`}</span>
      </div>
      <div id="plan" className={"plan" + (now ? " y26" : " radio")}>
        {ORDER.map((k) => {
          const here = isHere(k, era);
          const p = PEOPLE[k];
          return (
            <div key={k} className={"cell slot" + (here ? "" : " away")}>
              <button
                className={"pol" + (here ? "" : " away") + (person === k ? " sel" : "")}
                disabled={!here}
                aria-label={here ? "question " + p.name : `${p.name} is not here in ${era}`}
                onClick={() => { openTalk(k); document.getElementById("chatInput")?.focus(); }}
              >
                <Portrait who={k} era={era} />
                <span>{p.short}</span>
                {here && !visited.includes(k + era) && <span className="new">★ NEW</span>}
              </button>
              <span className="note">{here ? roleOf(k, +era) : `not in ${era}`}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
