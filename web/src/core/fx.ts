// Visual effects shared by screens: reduced motion, the radio static overlay and the portrait snow tile.
export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

let canvas: HTMLCanvasElement | null = null;
let level = 0;
let raf = 0;

export function attachNoise(c: HTMLCanvasElement | null) {
  canvas = c;
}
function tick() {
  if (!canvas || level <= 0.01) {
    if (canvas) canvas.style.opacity = "0";
    raf = 0;
    return;
  }
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(160, 90);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    img.data[i] = (v * 0.85) | 0;
    img.data[i + 1] = (v * 0.8) | 0;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  canvas.style.opacity = String(level);
  raf = requestAnimationFrame(tick);
}
export function setNoise(l: number) {
  level = reduced ? Math.min(l, 0.15) : l;
  if (!raf && level > 0.01) raf = requestAnimationFrame(tick);
  if (level <= 0.01 && canvas) canvas.style.opacity = "0";
}
export function burst(ms: number) {
  setNoise(0.85);
  setTimeout(() => setNoise(0), ms);
}

// Static tile for portraits on radio time points, drawn once and used as a CSS background (--snow).
export function paintSnowTile() {
  const c = document.createElement("canvas");
  c.width = c.height = 48;
  const x = c.getContext("2d")!;
  const d = x.createImageData(48, 48);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  document.documentElement.style.setProperty("--snow", `url(${c.toDataURL()})`);
}
