// Evidence slots in the memo window. A slot fills when an answer used one of its facts or its record card was found.
import { useEffect, useMemo, useRef, useState } from "react";
import { EVIDENCE, type Evidence, PEOPLE, itemSrc } from "../core/data";
import { evidenceCard, togglePin } from "../store/cards";
import { isPinned, useGame } from "../store/game";
import { toast } from "../store/ui";

// where each clue came from: the first answer that used one of its facts, or the place it was searched in
function useFound(): Record<string, string> {
  const { turns, records } = useGame();
  return useMemo(() => {
    const got: Record<string, string> = {};
    for (const e of EVIDENCE) {
      if (e.always) { got[e.icon] = "in the evidence box, 2026"; continue; }
      if (e.rec && records.includes(e.rec)) { got[e.icon] = "found by searching"; continue; }
      const t = turns.find((t) => (t.refs ?? []).some((r) => e.refs.includes(r)));
      if (t) got[e.icon] = `${PEOPLE[t.character]?.short ?? t.character} · ${t.timepoint === "T2026" ? "2026" : t.timepoint.slice(1)}`;
    }
    return got;
  }, [turns, records]);
}

export function EvidenceSlots() {
  const found = useFound();
  const { pins, appendMemo } = useGame();
  const [selected, setSelected] = useState<Evidence | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<string[]>([]);

  useEffect(() => {
    const keys = Object.keys(found);
    if (seen.current) {
      const added = keys.filter((k) => !seen.current!.has(k));
      added.forEach((k) => toast("evidence added: " + EVIDENCE.find((e) => e.icon === k)!.title));
      setFresh(added);
    }
    seen.current = new Set(keys);
  }, [found]);

  return (
    <>
      <span className="wtitle">evidence</span>
      <div className="evi" aria-label="evidence found">
        {EVIDENCE.map((e) => {
          const has = e.icon in found;
          const cls = [has && "got", has && isPinned(pins, evidenceCard(e)) && "shown", fresh.includes(e.icon) && "fresh", selected?.icon === e.icon && "sel"].filter(Boolean).join(" ");
          return (
            <button key={e.icon} type="button" className={cls} aria-label={has ? e.title : "not found yet"} onClick={() => has && setSelected(e)}>
              {has ? <img src={itemSrc(e.icon)} alt="" /> : "?"}
            </button>
          );
        })}
      </div>
      <div className="evinote" aria-live="polite">
        {selected && found[selected.icon] ? (
          <>
            <b>{selected.title}</b> · {found[selected.icon]}
            <button type="button" onClick={() => { appendMemo(`[evidence] ${selected.title} (${found[selected.icon]})`); toast("added to memo"); }}>+ memo</button>
            {selected.refs.length > 0 && (
              <button type="button" onClick={() => togglePin(evidenceCard(selected))}>{isPinned(pins, evidenceCard(selected)) ? "shown ✓" : "show"}</button>
            )}
          </>
        ) : (
          "clues you turn up in talks and places show here."
        )}
      </div>
    </>
  );
}
