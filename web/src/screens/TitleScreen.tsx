// Title: tune the radio to 11.23 and answer it. Answering starts a new game and opens the briefing.
import { useCallback, useEffect, useRef, useState } from "react";
import { burst, reduced } from "../core/fx";
import { useGame } from "../store/game";
import { useUi } from "../store/ui";

// five wide stations instead of a fine dial: the knob snaps to one; only 11.23 carries the voice
const STATIONS = [9.0, 10.0, 11.23, 12.0, 13.0];
const TARGET = 2;

export function TitleScreen() {
  const go = useUi((s) => s.go);
  const [station, setStation] = useState(0);
  const [touched, setTouched] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [secs, setSecs] = useState(41);
  const tuned = station === TARGET;
  const speaker = useRef<HTMLCanvasElement>(null);
  const staticLevel = useRef(1);
  staticLevel.current = tuned ? 0 : 0.55 + Math.abs(station - TARGET) * 0.2; // lighter one station away

  // speaker static, about 12 fps while the title is up
  useEffect(() => {
    const ctx = speaker.current!.getContext("2d")!;
    let alive = true;
    const draw = () => {
      if (!alive) return;
      const img = ctx.createImageData(48, 48);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = (Math.random() * 255 * staticLevel.current) | 0;
        img.data[i] = (v * 0.85) | 0; img.data[i + 1] = (v * 0.8) | 0; img.data[i + 2] = v; img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      if (!reduced) setTimeout(() => requestAnimationFrame(draw), 80);
    };
    draw();
    return () => { alive = false; };
  }, []);

  // the clock ticks toward 23:23 until the radio is tuned
  useEffect(() => {
    if (tuned) return;
    const t = setInterval(() => setSecs((s) => (s + 1) % 60), 1000);
    return () => clearInterval(t);
  }, [tuned]);

  const answer = useCallback(() => {
    if (!tuned || answered) return;
    setAnswered(true);
    useGame.getState().newGame();
    burst(reduced ? 0 : 420);
    setTimeout(() => go("brief"), reduced ? 0 : 420);
  }, [tuned, answered, go]);

  const answerBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && document.activeElement !== answerBtn.current) answer();
      if (!answered && (e.key === "ArrowLeft" || e.key === "ArrowRight") && (document.activeElement as HTMLElement)?.id !== "dial") {
        setTouched(true);
        setStation((s) => Math.max(0, Math.min(4, s + (e.key === "ArrowRight" ? 1 : -1))));
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [answer, answered]);

  const live = tuned ? " live" : "";
  const pos = `calc(8px + ${station * 25}% - ${station * 4}px)`; // needle and knob sit on the station's tick
  const status = answered ? "connecting…" : tuned ? "…something is on this channel. Answer it." : "Drag the knob to ▼11.23 until the static clears";
  return (
    <section id="s-title" className="screen" aria-labelledby="tLogo">
      <div className="wrap">
        <p className="t-eyebrow">Moonlight Labs · cold case 2016-0315</p>
        <h1 className={"t-logo" + live} id="tLogo">11:23</h1>
        <div className="win t-radio" role="group" aria-label="radio">
          <div className={"t-speaker" + live} aria-hidden="true"><canvas ref={speaker} width={48} height={48} /></div>
          <div className="t-body">
            <div className={"t-clock" + live}><span>{tuned ? "23:23:00" : `23:22:${String(secs).padStart(2, "0")}`}</span> <i aria-hidden="true">■</i></div>
            <div className={"t-dialbox" + (touched ? " touched" : "")}>
              <input
                type="range" id="dial" min={0} max={4} step={1} value={station} disabled={answered}
                aria-label="radio station, tune to 11.23"
                aria-valuetext={(station === TARGET ? "11.23" : STATIONS[station].toFixed(1)) + " MHz"}
                onPointerDown={() => setTouched(true)}
                onChange={(e) => { setTouched(true); setStation(+e.target.value); }}
              />
              <div className={"t-tuner" + live}>
                <i className="t-needle" style={{ left: pos }} />
                <div className="t-ticks" aria-hidden="true"><span>9.0</span><span>10.0</span><span className="t-target">▼11.23</span><span>12.0</span><span>13.0</span></div>
              </div>
              <span className="t-knob" style={{ left: pos }} aria-hidden="true">◀ drag ▶</span>
            </div>
            <p className={"t-hint" + live} role="status">{status}</p>
          </div>
        </div>
        <p className="t-lede">Every night at 11:23, a dead radio picks up a woman who died ten years ago.</p>
        <button ref={answerBtn} className="t-answer" disabled={!tuned || answered} onClick={answer}>Answer the radio</button>
      </div>
      <div className="t-keys" aria-hidden="true"><span><b>←→</b>Tune</span><span><b>Enter</b>Answer</span></div>
    </section>
  );
}
