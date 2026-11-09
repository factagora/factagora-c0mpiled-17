// Leaderboard from the server (GET /api/scores), with this player's entry marked.
import { useEffect, useState } from "react";
import { type Ending, type ScoreRow, fetchScores } from "../api/client";
import { useUi } from "../store/ui";

const ENDING_LABEL: Record<Ending, string> = { SOLVED: "solved", PARTLY: "partly solved", WRONG: "wrong suspect" };

export function BoardScreen() {
  const { me, go } = useUi();
  const [rows, setRows] = useState<ScoreRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchScores().then((r) => { setRows(r.entries); setTotal(r.total); }).catch((e) => setError((e as Error).message));
    scrollTo(0, 0);
  }, []);

  const isMe = (r: ScoreRow) => !!me && r.rank === me.rank && r.nick === me.nick;
  return (
    <section id="s-board" className="screen" aria-labelledby="boardTitle">
      <div className="wrap">
        <div className="win board">
          <p className="vkicker">case 2016-0315 · leaderboard</p>
          <h2 className="wtitle" id="boardTitle">top detectives</h2>
          <p className="bme" role="status">
            {error || (me && (me.rank ? `registered. ${me.nick}, you placed #${me.rank} of ${total}.` : `registered. ${me.nick}, you are below the top ${rows?.length ?? 0}.`))}
          </p>
          <ol className="brows">
            {rows?.map((r) => (
              <li key={r.rank + r.nick} className={isMe(r) ? "me" : ""}>
                <span className="rk">#{r.rank}</span>
                <span className="nm">{r.nick + (isMe(r) ? "  (you)" : "")}</span>
                <span className={"end " + (r.ending === "WRONG" ? "no" : r.ending === "SOLVED" ? "ok" : "")}>{ENDING_LABEL[r.ending]}</span>
                <span className="sc">{r.score} pts</span>
              </li>
            ))}
          </ol>
          <div className="mbtns">
            <button type="button" className="pbtn ghostb" autoFocus onClick={() => go("map")}>◀ back to the case</button>
            <button type="button" className="pbtn" onClick={() => location.reload()}>play again</button>
          </div>
        </div>
      </div>
    </section>
  );
}
