// Page background: pixel night sky, era backdrop art, radio static overlay and scanlines.
import { useEffect, useRef } from "react";
import { attachNoise, reduced } from "../core/fx";

function useNightSky(ref: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const sky = ref.current!;
    const ctx = sky.getContext("2d")!;
    let stars: { x: number; y: number; b: number; big: boolean }[] = [];
    let w = 0, h = 0, frame = 0, last = 0, raf = 0;
    const size = () => {
      w = Math.ceil(innerWidth / 3);
      h = Math.ceil(innerHeight / 3);
      sky.width = w;
      sky.height = h;
      stars = Array.from({ length: (w * h) / 90 }, () => ({ x: (Math.random() * w) | 0, y: (Math.random() * h * 0.66) | 0, b: Math.random(), big: Math.random() < 0.06 }));
    };
    const draw = () => {
      const g = ctx.createLinearGradient(0, 0, 0, h * 0.68);
      g.addColorStop(0, "#0d0930");
      g.addColorStop(1, "#2e238f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      stars.forEach((s) => {
        const tw = reduced ? 1 : 0.5 + 0.5 * Math.sin(frame * 0.15 + s.b * 20);
        ctx.fillStyle = `rgba(236,234,255,${0.35 + 0.65 * tw * s.b})`;
        ctx.fillRect(s.x, s.y, 1, 1);
        if (s.big && tw > 0.6) { ctx.fillRect(s.x - 1, s.y, 3, 1); ctx.fillRect(s.x, s.y - 1, 1, 3); }
      });
      const mx = (w * 0.86) | 0, my = (h * 0.12) | 0, r = Math.max(6, (h * 0.045) | 0);
      ctx.fillStyle = "rgba(245,232,180,.18)"; ctx.beginPath(); ctx.arc(mx, my, r * 2.2, 0, 7); ctx.fill();
      ctx.fillStyle = "#f3e7bf"; ctx.beginPath(); ctx.arc(mx, my, r, 0, 7); ctx.fill();
      ctx.fillStyle = "#d9cba0"; ctx.fillRect(mx - 2, my - 1, 2, 2); ctx.fillRect(mx + 2, my + 2, 3, 2);
      // city skyline: low pixel blocks with a few lit windows
      const sy = (h * 0.68) | 0;
      ctx.fillStyle = "#120e4c"; ctx.fillRect(0, sy, w, h - sy);
      for (let x = 0, i = 0; x < w; i++) {
        const bw = 8 + ((i * 37) % 14), bh = 10 + ((i * 53) % 28);
        ctx.fillStyle = "#0b0930"; ctx.fillRect(x, sy - bh, bw, bh + 2);
        for (let wy = sy - bh + 3; wy < sy - 2; wy += 4)
          for (let wx = x + 2; wx < x + bw - 2; wx += 3)
            if ((wx * 7 + wy * 13 + i) % 11 === 0) { ctx.fillStyle = "rgba(245,196,81,.55)"; ctx.fillRect(wx, wy, 1, 1); }
        x += bw + 1;
      }
    };
    // the sky sits behind screens that cover it with their own art; skip drawing there
    const hidden = () => ["title", "brief", "map", "places"].includes(document.documentElement.dataset.screen ?? "");
    const loop = (t: number) => {
      if (t - last > 110 && !hidden()) { last = t; frame++; draw(); }
      raf = requestAnimationFrame(loop);
    };
    const onResize = () => { size(); draw(); };
    size(); draw();
    if (!reduced) raf = requestAnimationFrame(loop);
    addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", onResize); };
  }, [ref]);
}

export function Backdrop() {
  const sky = useRef<HTMLCanvasElement>(null);
  useNightSky(sky);
  return (
    <>
      <canvas id="sky" ref={sky} aria-hidden="true" />
      <div id="eraBg" aria-hidden="true"><i className="bg-office" /><i className="bg-seoul" /></div>
      <canvas id="noise" ref={attachNoise} width={160} height={90} aria-hidden="true" />
      <div id="vhs" aria-hidden="true" />
    </>
  );
}
