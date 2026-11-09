// Accuse: pick one suspect. The memo is sent as the motive and scored on the server. One try.
import { type FormEvent, useState } from "react";
import { accuse } from "../api/client";
import { PEOPLE, type PersonId, SUSPECTS, roleOf } from "../core/data";
import { useGame } from "../store/game";
import { useUi } from "../store/ui";
import { Portrait } from "./Portrait";

export function AccusePanel({ hidden }: { hidden: boolean }) {
  const { setAccuseOpen, setVerdict, setVerdictOpen, verdict, accused } = useUi();
  const [pick, setPick] = useState<PersonId | null>(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("pick one person to submit. your memo is scored as the motive.");
  const done = !!verdict;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!pick) { setMsg("pick who did it."); return; }
    setSending(true);
    setMsg("sending…");
    try {
      const v = await accuse(pick, useGame.getState().memo.slice(-8000));
      setVerdict(v, pick);
      setMsg(`you named ${PEOPLE[pick].name}.`);
    } catch {
      setMsg("could not reach the case server. try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form id="accuseView" className={"mview" + (done ? " done" : "")} hidden={hidden} noValidate onSubmit={submit}>
      <span className="wtitle">{done ? "accusation sent" : "accuse"}</span>
      <fieldset className="suslist" aria-labelledby="susLegend">
        <legend id="susLegend" className="mstep">
          who did it? <b className={pick || accused ? "on" : ""}>{(pick ?? accused) ? PEOPLE[(pick ?? accused)!].name : "pick one"}</b>
        </legend>
        <div id="susOpts">
          {SUSPECTS.map((k) => (
            <label key={k} className="sus">
              <input type="radio" name="suspect" value={k} checked={(pick ?? accused) === k} disabled={done || sending} onChange={() => setPick(k)} />
              <Portrait who={k} era="2016" />
              <span>{PEOPLE[k].name}<small className="muted">{roleOf(k, 2016)}</small></span>
            </label>
          ))}
        </div>
      </fieldset>
      <small aria-live="polite">{msg}</small>
      <div className="mbtns">
        {done && <button type="button" className="pbtn ghostb" onClick={() => setVerdictOpen(true)}>verdict</button>}
        <button type="button" className="pbtn ghostb" onClick={() => setAccuseOpen(false)}>◀ memo</button>
        <button className="pbtn" disabled={done || sending}>submit</button>
      </div>
    </form>
  );
}
