// A person's portrait for a year, over a drawn placeholder with initials (shown only if the image fails).
import { useState } from "react";
import { type Era, type PersonId, PEOPLE, portraitSrc } from "../core/data";

export function Portrait({ who, era }: { who: PersonId; era: Era }) {
  const p = PEOPLE[who];
  const src = portraitSrc(who, era);
  const [failed, setFailed] = useState<string | null>(null);
  const art = !!src && failed !== src;
  return (
    <div className={"ph" + (art ? " art" : "")} style={{ "--hair": p.hair, "--suit": p.suit } as React.CSSProperties}>
      {p.ini}
      {art && <img src={src} alt="" decoding="async" onError={() => setFailed(src)} />}
    </div>
  );
}
