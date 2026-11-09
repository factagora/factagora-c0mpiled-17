// One short message at the bottom of the screen; a new message replaces the old one.
import { useEffect, useState } from "react";
import { useUi } from "../store/ui";

export function Toast() {
  const toast = useUi((s) => s.toast);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!toast) return;
    setOn(true);
    const t = setTimeout(() => setOn(false), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  return <div id="toast" className={on ? "on" : ""} role="status" aria-live="polite">{toast?.msg}</div>;
}
