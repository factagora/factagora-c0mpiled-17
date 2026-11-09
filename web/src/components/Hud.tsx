// Top bar on the map and places screens: the current year and the menu.
import { ERAS } from "../core/data";
import { type Screen, useUi } from "../store/ui";

export function Hud() {
  const { era, screen, go, setAccuseOpen } = useUi();
  const now = era === "2026";
  const i = ERAS.indexOf(era);
  const nav = (to: Screen, label: string) => (
    <button aria-current={screen === to ? "true" : "false"} onClick={() => go(to)}>{label}</button>
  );
  return (
    <header id="hud">
      <div className="wrap">
        <div className="win timebox">
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 18px" }}>
            <span className="tt">{now ? "NOW  2026" : `RADIO  ${era}-03-15  22:50`}</span>
          </div>
          <div className="bars">
            {ERAS.map((e, j) => <i key={e} className={j === i ? (now ? "on26" : "on") : ""} />)}
          </div>
        </div>
        <nav className="win navbox" aria-label="menu">
          {nav("map", "map")}<span className="sep">|</span>
          {nav("places", "places")}<span className="sep">|</span>
          <button onClick={() => go("brief")}>briefing</button><span className="sep">|</span>
          <button onClick={() => { go("map"); setAccuseOpen(true); }}>accuse</button>
        </nav>
      </div>
    </header>
  );
}
