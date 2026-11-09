// Chat with the person picked on the map. Each person and year keeps its own conversation; pinned cards go along.
import { type FormEvent, Fragment, type RefObject, useEffect, useRef, useState } from "react";
import { askCharacter } from "../api/client";
import { ERA_NOTE, PEOPLE, roleOf, timepointOf } from "../core/data";
import { togglePin, turnCard, whenOf } from "../store/cards";
import { isPinned, useGame } from "../store/game";
import { toast, useUi } from "../store/ui";

const introOf = (era: string) =>
  era === "2026"
    ? "Ten years later. The survivors remember less and hide more. Ask the same things and listen for what changed."
    : `March 15, ${era}, 22:50 · ${ERA_NOTE[era as keyof typeof ERA_NOTE]}. The radio is live and nobody knows what is coming. Pick someone on the map to talk.`;

// drag the grip (or arrow keys) to resize the chat; kept only for this page load
function useResize(wrap: RefObject<HTMLDivElement>, chat: RefObject<HTMLDivElement>) {
  const setHeight = (px: number) => {
    const max = (wrap.current?.clientHeight ?? 0) - 280 - 40; // keep the map/memo row at its minimum plus the row gap
    wrap.current?.style.setProperty("--chatH", Math.round(Math.max(120, Math.min(max, px))) + "px");
  };
  return {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      const grip = e.currentTarget;
      grip.setPointerCapture(e.pointerId);
      const bottom = chat.current!.getBoundingClientRect().bottom;
      const move = (ev: PointerEvent) => setHeight(bottom - ev.clientY);
      grip.addEventListener("pointermove", move);
      grip.classList.add("drag");
      grip.addEventListener("lostpointercapture", () => { grip.removeEventListener("pointermove", move); grip.classList.remove("drag"); }, { once: true });
    },
    onDoubleClick: () => wrap.current?.style.removeProperty("--chatH"),
    onKeyDown: (e: React.KeyboardEvent) => {
      const d = ({ ArrowUp: 20, ArrowDown: -20 } as Record<string, number>)[e.key];
      if (!d) return;
      e.preventDefault();
      setHeight((chat.current?.offsetHeight ?? 0) + d);
    },
  };
}

export function ChatPanel({ wrap }: { wrap: RefObject<HTMLDivElement> }) {
  const { era, person, asking, setAsking } = useUi();
  const { id, turns, pins, addTurn, appendMemo } = useGame();
  const [input, setInput] = useState("");
  const chat = useRef<HTMLDivElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const resize = useResize(wrap, chat);
  const p = person ? PEOPLE[person] : null;
  const tp = timepointOf(era);
  const here = person ? turns.filter((t) => t.character === person && t.timepoint === tp) : [];

  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [here.length, asking, person, era]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || !person || asking) return;
    setAsking(question);
    setInput("");
    // only this person's conversation in this year goes back as history
    const history = here.slice(-10).flatMap((t) => [
      { role: "user" as const, content: t.question },
      { role: "assistant" as const, content: t.answer },
    ]);
    try {
      const r = await askCharacter({ gameId: id, character: person, timepoint: tp, question, history, evidence: pins });
      addTurn({ character: person, timepoint: tp, question, answer: r.answer, refs: r.refs ?? [], at: Date.now() });
    } catch (err) {
      toast((err as Error).message || "no answer, try again");
      setInput(question);
    } finally {
      setAsking(null);
      document.getElementById("chatInput")?.focus();
    }
  }

  return (
    <div className="win chat" ref={chat}>
      <div className="chatgrip" role="separator" aria-orientation="horizontal" aria-label="resize chat" title="drag up or down to resize · double-click to reset" tabIndex={0} {...resize}>
        <span className="griptab" aria-hidden="true"><i />drag to resize<i /></span>
      </div>
      <span className="win tablabel">{p ? `chat · ${p.short} · ${era}` : "CASE FILE"}</span>
      <div className="chatlog" ref={log} aria-live="polite">
        {!p && <p className="intro">{introOf(era)}</p>}
        {p && !here.length && !asking && <p className="intro muted">{`${p.name} · ${roleOf(person!, +era)} · ${era}. Ask anything.`}</p>}
        {p && here.map((t) => (
          <Fragment key={t.at}>
            <div className="msg me"><b>you</b>{t.question}</div>
            <div className="msg">
              <b>{p.short}</b>{t.answer}
              <div className="acts">
                <button type="button" className="tomemo" onClick={() => { appendMemo(`[${whenOf(t.timepoint)} · ${p.short}] ${t.answer}`); toast("added to memo"); }}>→ memo</button>
                <button type="button" className={"tomemo" + (isPinned(pins, turnCard(t)) ? " on" : "")} onClick={() => togglePin(turnCard(t))}>
                  {isPinned(pins, turnCard(t)) ? "pinned ✓" : "pin"}
                </button>
              </div>
            </div>
          </Fragment>
        ))}
        {p && pins.length > 0 && <p className="intro muted">{`you are showing ${pins.length} card${pins.length > 1 ? "s" : ""}: pinned answers and evidence.`}</p>}
        {p && asking && (<><div className="msg me"><b>you</b>{asking}</div><p className="intro muted">{`${p.short} is answering…`}</p></>)}
      </div>
      <form className="chatform" onSubmit={send}>
        <input
          id="chatInput" autoComplete="off" aria-label="message" value={input} onChange={(e) => setInput(e.target.value)}
          disabled={!p || !!asking}
          placeholder={p ? `message ${p.short} (${era === "2026" ? "in person" : "by radio"})…` : "pick someone on the map to talk"}
        />
        <button disabled={!p || !!asking}>send</button>
      </form>
    </div>
  );
}
