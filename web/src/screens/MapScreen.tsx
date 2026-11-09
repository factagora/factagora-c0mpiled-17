// Main screen: people on the map for the chosen year, evidence and memo (or the accuse panel), and the chat.
import { useRef } from "react";
import { AccusePanel } from "../components/AccusePanel";
import { ChatPanel } from "../components/ChatPanel";
import { EvidenceSlots } from "../components/EvidenceSlots";
import { PeoplePlan } from "../components/PeoplePlan";
import { TimeSlider } from "../components/TimeSlider";
import { useGame } from "../store/game";
import { useUi } from "../store/ui";

function MemoView({ hidden }: { hidden: boolean }) {
  const { memo, setMemo } = useGame();
  const setAccuseOpen = useUi((s) => s.setAccuseOpen);
  return (
    <div className="mview" hidden={hidden}>
      <EvidenceSlots />
      <label className="wtitle" htmlFor="memo" style={{ marginTop: 10 }}>memo</label>
      <textarea id="memo" value={memo} onChange={(e) => setMemo(e.target.value)} spellCheck={false}
        placeholder={"write anything here…\nwho lied, what time, what to ask next."} />
      <small>notes stay in this browser until you start a new game.</small>
      <div className="mbtns"><button type="button" className="pbtn" onClick={() => setAccuseOpen(true)}>accuse ▶</button></div>
    </div>
  );
}

export function MapScreen() {
  const accuseOpen = useUi((s) => s.accuseOpen);
  const wrap = useRef<HTMLDivElement>(null);
  return (
    <section id="s-map" className="screen">
      <div className="wrap" ref={wrap}>
        <div className="mapgrid">
          <div className="win">
            <PeoplePlan />
            <TimeSlider />
          </div>
          <div className="win memo">
            <MemoView hidden={accuseOpen} />
            <AccusePanel hidden={!accuseOpen} />
          </div>
        </div>
        <ChatPanel wrap={wrap} />
      </div>
    </section>
  );
}
