import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ERAS, EVIDENCE, ORDER, itemSrc, portraitSrc } from "./core/data";
import { paintSnowTile } from "./core/fx";
import "./styles/game.css";
import "./styles/app.css";

paintSnowTile();

// After the page has loaded (so nothing competes with the title background), fetch and decode the rest of the art:
// every portrait look, the evidence item icons (place search spots, record cards, evidence slots) and the place backgrounds.
// The images are kept in `preloaded` so the browser holds them until a screen needs them.
const PLACE_BACKGROUNDS = ["bg_office_2016", "bg_seoul_2026", "bg_server_hall", "bg_evidence_room"].map((b) => `/assets/bg/${b}.webp`);
const preloaded: HTMLImageElement[] = [];
const preloadArt = () => {
  const srcs = new Set([
    ...ORDER.flatMap((k) => ERAS.map((e) => portraitSrc(k, e))),
    ...EVIDENCE.map((e) => itemSrc(e.icon)),
    ...PLACE_BACKGROUNDS,
  ]);
  for (const src of srcs) {
    if (!src) continue;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    img.decode().catch(() => {});
    preloaded.push(img);
  }
};
if (document.readyState === "complete") setTimeout(preloadArt, 0);
else addEventListener("load", () => setTimeout(preloadArt, 0), { once: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
