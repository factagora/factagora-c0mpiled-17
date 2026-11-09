// The year slider under the map: seven stops, the last one is 2026 in person.
import { ERAS } from "../core/data";
import { useUi } from "../store/ui";

export function TimeSlider() {
  const { era, setEra } = useUi();
  const now = era === "2026";
  return (
    <div className="timeslider">
      <label className="wtitle" htmlFor="timeRange">time</label>
      <input
        type="range" id="timeRange" className={now ? "y26" : ""} min={0} max={ERAS.length - 1} step={1}
        value={ERAS.indexOf(era)} aria-describedby="timeOut"
        onChange={(e) => setEra(ERAS[+e.target.value])}
      />
      <output id="timeOut" htmlFor="timeRange" className={now ? "y26" : ""}>{now ? "in person" : "radio 22:50"}</output>
      <div className="tsticks" aria-hidden="true">
        {ERAS.map((e) => <span key={e}>{e}</span>)}
        <i className="death" title="Julia Han found dead, 2016-03-15 23:23">†</i>
      </div>
    </div>
  );
}
