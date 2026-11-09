// Fits the 1920×1080 stage into each .stage-viewport.
// Default 'fit' (web): fill the viewport but never scale above 1×,
//   so text does not get oversized on large monitors; wider screens get centered with margins.
// data-scale="crisp": the largest scale at which one art pixel is a whole number of device pixels (sharp, more letterbox).
// When info text (--fs-ui) would render below 16 browser px, data-text-auto="large" switches to large text.
const ART_W = 960, ART_H = 540, STAGE_PER_ART = 2;
const STAGE_W = ART_W * STAGE_PER_ART, STAGE_H = ART_H * STAGE_PER_ART;
const MIN_CSS_TEXT = 16;

const fit = (vp) => {
  const stage = vp.querySelector(":scope > .stage");
  if (!stage) return;
  const w = vp.clientWidth, h = vp.clientHeight, dpr = window.devicePixelRatio || 1;
  let scale;
  if (vp.dataset.scale === "crisp") {
    const k = Math.max(1, Math.floor(Math.min((w * dpr) / ART_W, (h * dpr) / ART_H)));
    scale = k / (STAGE_PER_ART * dpr);
  } else {
    scale = Math.min(1, w / STAGE_W, h / STAGE_H);
  }
  stage.style.setProperty("--stage-scale", scale);
  stage.style.setProperty("--stage-x", `${Math.round((w - STAGE_W * scale) / 2)}px`);
  stage.style.setProperty("--stage-y", `${Math.round((h - STAGE_H * scale) / 2)}px`);

  // Text floor: switch to large text if base size × scale is below 16px
  const baseUi = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fs-ui")) || 24;
  if (baseUi * scale < MIN_CSS_TEXT) vp.dataset.textAuto = "large"; else delete vp.dataset.textAuto;
  vp.dataset.cssTextPx = (parseFloat(getComputedStyle(stage).fontSize) * scale).toFixed(1); // debug: rendered text size in browser px
};

const fitAll = () => document.querySelectorAll(".stage-viewport").forEach(fit);
const ro = new ResizeObserver((entries) => entries.forEach((e) => fit(e.target)));
document.querySelectorAll(".stage-viewport").forEach((vp) => { fit(vp); ro.observe(vp); });

// Called from settings
window.GameStage = {
  setMode(mode) {   // "fit" | "crisp"
    document.querySelectorAll(".stage-viewport").forEach((vp) => {
      if (mode === "crisp") vp.dataset.scale = "crisp"; else delete vp.dataset.scale;
    });
    fitAll();
  },
  refit: fitAll,
};
