import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ERAS, ORDER, portraitSrc } from "./core/data";
import { paintSnowTile } from "./core/fx";
import "./styles/game.css";
import "./styles/app.css";

paintSnowTile();

// Preload every portrait look only after the page has loaded, so they do not compete with the title background.
const preloadLooks = () => {
  for (const src of new Set(ORDER.flatMap((k) => ERAS.map((e) => portraitSrc(k, e))))) if (src) new Image().src = src;
};
if (document.readyState === "complete") setTimeout(preloadLooks, 0);
else addEventListener("load", () => setTimeout(preloadLooks, 0), { once: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
