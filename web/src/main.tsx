import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { paintSnowTile } from "./core/fx";
import "./styles/game.css";
import "./styles/app.css";

paintSnowTile();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
