// Places of the current year: go into one, talk to who is there, or search spots for record cards.
import { useState } from "react";
import { type Place, PEOPLE, RECORDS, type RecordId, SPOTS, artStyle, itemSrc, placesOf, portraitSrc } from "../core/data";
import { useGame } from "../store/game";
import { useUi } from "../store/ui";

function Room({ place, onBack }: { place: Place; onBack: () => void }) {
  const { era, erasSeen, go, openTalk } = useUi();
  const { records, addRecord } = useGame();
  const [shown, setShown] = useState<{ id: RecordId; open: boolean } | null>(null);
  const spots = SPOTS[place.key] ?? [];
  // a record card can be found once the player has visited its year (or later) on the radio
  const isOpen = (id: RecordId) => { const f = RECORDS[id].from; return !f || erasSeen.some((e) => e >= f); };

  return (
    <div className="room" style={artStyle(place.key)}>
      <div className="room-head">
        <button type="button" className="back" autoFocus onClick={onBack}>◀ places</button>
        <span className="rname">{place.lbl}</span>
        {place.sub && <span className="rsub">{place.sub}</span>}
      </div>
      <div className="room-people">
        {place.people.map((k) => (
          <button key={k} type="button" onClick={() => { go("map"); openTalk(k); }}>
            <img src={portraitSrc(k, era) ?? ""} alt="" />{`talk to ${PEOPLE[k].short}`}
          </button>
        ))}
      </div>
      {shown && (
        <div className="room-card">
          {shown.open ? (
            <>
              <img src={itemSrc(RECORDS[shown.id].icon)} alt="" />
              <div><b>{RECORDS[shown.id].title}</b><p>{RECORDS[shown.id].line}</p><small>record card · added to your evidence</small></div>
            </>
          ) : (
            <div><b>something is here…</b><p>{`Not yet. Visit ${RECORDS[shown.id].from} or later on the radio, then come back.`}</p></div>
          )}
        </div>
      )}
      {spots.map(([id, x, y]) => {
        const open = isOpen(id);
        return (
          <button
            key={id} type="button"
            className={"spot" + (open ? "" : " locked") + (records.includes(id) ? " found" : "")}
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-label={open ? "search: " + RECORDS[id].title : `locked: visit ${RECORDS[id].from} or later`}
            onClick={() => { if (open) addRecord(id); setShown({ id, open }); }}
          >
            <img src={itemSrc(RECORDS[id].icon)} alt="" />
          </button>
        );
      })}
      {!spots.length && <span className="room-empty">{place.people.length ? "nothing to search here. talk to who is here." : "nothing here tonight."}</span>}
    </div>
  );
}

export function PlacesScreen() {
  const era = useUi((s) => s.era);
  const [room, setRoom] = useState<Place | null>(null);
  const now = era === "2026";
  return (
    <section id="s-places" className="screen" aria-labelledby="plTitle">
      <div className="wrap">
        <div className="win">
          <div className="phead">
            <span className="wtitle" id="plTitle">{now ? "places · seoul 2026" : `places · moonlight labs ${era}`}</span>
            <span className="muted">{now ? "in person" : `${era}-03-15 · 22:50 · by radio`}</span>
          </div>
          {room ? (
            <Room place={room} onBack={() => setRoom(null)} />
          ) : (
            <div className="pgrid">
              {placesOf(era).map((c) => (
                <button key={c.key} type="button" className="pcard" style={artStyle(c.key)} onClick={() => setRoom(c)}>
                  <span className="lbl">{c.lbl}</span>
                  {c.sub && <span className="sub">{c.sub}</span>}
                  <span className="faces">{c.people.map((k) => <img key={k} src={portraitSrc(k, era) ?? ""} alt={PEOPLE[k].short} title={PEOPLE[k].short} />)}</span>
                  <span className="go">{SPOTS[c.key] ? "search ▶" : "enter ▶"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
