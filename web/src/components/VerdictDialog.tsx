// The verdict after an accusation, and registering the score under a detective name.
import { type FormEvent, useEffect, useRef, useState } from "react";
import { registerScore } from "../api/client";
import { PEOPLE } from "../core/data";
import { useUi } from "../store/ui";

const NICK_OK = /^[\p{L}\p{N}_-]{2,12}$/u;

function ScoreBar({ culprit, motive }: { culprit: number; motive: number }) {
  // the bar is 100 points wide: culprit (30) and motive (70), each filled by the points earned
  const part = (cls: string, label: string, points: number, max: number) => {
    const pct = Math.min(100, (points / max) * 100);
    return (
      <div className={"sgroup " + cls}>
        <span className="slab">{label}</span>
        <div className="track"><i className="fill" style={{ width: `${pct}%`, minWidth: pct > 0 ? 3 : undefined }} /></div>
      </div>
    );
  };
  return <div className="sbar" aria-hidden="true">{part("c", "culprit", culprit, 30)}{part("m", "motive", motive, 70)}</div>;
}

export function VerdictDialog() {
  const { verdict: v, accused, verdictOpen, setVerdictOpen, me, setMe, go } = useUi();
  const ref = useRef<HTMLDialogElement>(null);
  const [naming, setNaming] = useState(false);
  const [nick, setNick] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = ref.current!;
    if (verdictOpen && !d.open) d.showModal();
    if (!verdictOpen && d.open) d.close();
  }, [verdictOpen]);

  async function register(e: FormEvent) {
    e.preventDefault();
    const name = nick.trim();
    if (!NICK_OK.test(name)) { setError("use 2–12 letters, numbers, _ or -."); return; }
    if (!v?.verdictId) { setError("this verdict cannot be registered. reload to play again."); return; }
    setBusy(true);
    setError("");
    try {
      const r = await registerScore(name, v.verdictId);
      setMe({ nick: name, rank: r.entry.rank });
      setVerdictOpen(false);
      go("board");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const total = v ? v.total_score ?? v.score : 0;
  const culprit = v ? v.culprit_points ?? (v.correct ? 30 : 0) : 0;
  const motive = v ? v.motive_points ?? total - culprit : 0;
  return (
    <dialog ref={ref} className={"win verdict" + (v && !v.correct ? " bad" : "")} aria-labelledby="vTitle" onClose={() => setVerdictOpen(false)}>
      {v && accused && (
        <>
          <p className="vkicker">case 2016-0315 · verdict</p>
          <h2 id="vTitle">{v.title}</h2>
          <dl className="vrows">
            <dt>culprit</dt>
            <dd><span>{PEOPLE[accused].name}</span> <b id="vMark" className={v.correct ? "ok" : "no"}>{v.correct ? "✓ correct" : "! wrong"}</b></dd>
            <dt>score<b className="vtotal">{`${total} / 100`}</b></dt>
            <dd>
              <ScoreBar culprit={culprit} motive={motive} />
              <ul id="vMotives">
                {!v.motives.length && <li>no known motive found in what you wrote.</li>}
                {v.motives.map((m) => (
                  <li key={m.id} className={m.counted ? "on" : ""}><span>{(m.counted ? "✓ " : "— ") + m.label}</span><span>{m.counted ? m.earned ?? m.points : 0}</span></li>
                ))}
              </ul>
            </dd>
          </dl>
          <blockquote>{`${PEOPLE[accused].short}: “${v.reaction}”`}</blockquote>
          <div id="vSummary">{v.summary.map((t) => <p key={t}>{t}</p>)}</div>
          <p className="muted vfoot">no retry. reload the page to start over.</p>
          {!naming ? (
            <div className="mbtns" id="vBtns">
              <button type="button" className="pbtn ghostb" onClick={() => setVerdictOpen(false)}>close</button>
              <button type="button" className="pbtn" onClick={() => (me ? (setVerdictOpen(false), go("board")) : setNaming(true))}>
                {me ? "leaderboard ▶" : "register my score ▶"}
              </button>
            </div>
          ) : (
            <form className="nickform" noValidate onSubmit={register}>
              <label htmlFor="nick" className="wtitle">your detective name</label>
              <p className="muted">it shows on the leaderboard next to your score.</p>
              <input id="nick" maxLength={12} autoComplete="nickname" spellCheck={false} placeholder="2–12 letters or numbers" autoFocus
                aria-describedby="nickMsg" aria-invalid={!!error || undefined} value={nick} disabled={busy}
                onChange={(e) => { setNick(e.target.value); setError(""); }} />
              <small id="nickMsg" className={error ? "err" : ""} aria-live="polite">{busy ? "registering…" : error}</small>
              <div className="mbtns">
                <button type="button" className="pbtn ghostb" onClick={() => setNaming(false)}>◀ back</button>
                <button className="pbtn" disabled={busy}>register</button>
              </div>
            </form>
          )}
        </>
      )}
    </dialog>
  );
}
