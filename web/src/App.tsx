// Screen switching. The game CSS shows and hides parts by html[data-screen] and html[data-bg], so those are kept in sync here.
import { useEffect } from "react";
import { Backdrop } from "./components/Backdrop";
import { Hud } from "./components/Hud";
import { Toast } from "./components/Toast";
import { VerdictDialog } from "./components/VerdictDialog";
import { BoardScreen } from "./screens/BoardScreen";
import { BriefScreen } from "./screens/BriefScreen";
import { MapScreen } from "./screens/MapScreen";
import { PlacesScreen } from "./screens/PlacesScreen";
import { TitleScreen } from "./screens/TitleScreen";
import { useUi } from "./store/ui";

export function App() {
  const screen = useUi((s) => s.screen);
  const era = useUi((s) => s.era);

  useEffect(() => {
    document.documentElement.dataset.screen = screen;
  }, [screen]);
  useEffect(() => {
    document.documentElement.dataset.bg = era >= "2025" ? "seoul" : "office";
  }, [era]);

  return (
    <>
      <Backdrop />
      <Hud />
      <main>
        {screen === "title" && <TitleScreen />}
        {screen === "brief" && <BriefScreen />}
        {screen === "map" && <MapScreen />}
        {screen === "places" && <PlacesScreen />}
        {screen === "board" && <BoardScreen />}
      </main>
      <VerdictDialog />
      <Toast />
      <div className="scanlines" aria-hidden="true" />
    </>
  );
}
