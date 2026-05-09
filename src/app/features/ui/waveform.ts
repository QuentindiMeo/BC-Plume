import { getAppCoreInstance } from "@/app/stores/AppCoreImpl";
import { decodeWaveformForCurrentTrack } from "@/app/use-cases/decode-waveform";
import { PLUME_ELEM_SELECTORS } from "@/infra/elements/plume";
import { getString } from "@/shared/i18n";

let cachedPeaks: Float32Array | null = null;
let decodeAbortFlag = false;

export const createWaveformCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.id = PLUME_ELEM_SELECTORS.waveformCanvas.split("#")[1];
  canvas.ariaLabel = getString("ARIA__WAVEFORM_CANVAS");

  const isEnabled = getAppCoreInstance().getState().featureFlags.waveform;
  if (!isEnabled) canvas.classList.add("plume-feature-hidden");

  return canvas;
};

export const renderWaveform = (
  canvas: HTMLCanvasElement,
  peaks: Float32Array,
  progressFraction: number,
  accentColor: string
): void => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  if (width === 0 || height === 0) return;

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);

  const peakCount = peaks.length;
  const columnWidth = width / peakCount;
  const midY = height / 2;

  for (let i = 0; i < peakCount; i++) {
    const barHalfHeight = (peaks[i] as number) * midY * 0.9;
    const x = i * columnWidth;

    ctx.fillStyle = i / peakCount < progressFraction ? accentColor : "rgba(128,128,128,0.35)";
    ctx.fillRect(x, midY - barHalfHeight, Math.max(columnWidth - 1, 1), barHalfHeight * 2);
  }
};

export const triggerWaveformDecode = async (canvas: HTMLCanvasElement): Promise<void> => {
  // Fast path: peaks already cached for this track — skip decode and render immediately.
  if (cachedPeaks) {
    canvas.classList.remove("plume-feature-hidden");
    const appState = getAppCoreInstance().getState();
    const progressFraction =
      appState.currentTime != null && appState.duration ? appState.currentTime / appState.duration : 0;
    renderWaveform(canvas, cachedPeaks, progressFraction, getAccentColor());
    return;
  }

  decodeAbortFlag = false;
  const peaks = await decodeWaveformForCurrentTrack();

  if (decodeAbortFlag) return;
  if (!peaks) return;

  cachedPeaks = peaks;
  canvas.classList.remove("plume-feature-hidden");

  const appState = getAppCoreInstance().getState();
  const progressFraction =
    appState.currentTime != null && appState.duration ? appState.currentTime / appState.duration : 0;

  renderWaveform(canvas, cachedPeaks, progressFraction, getAccentColor());
};

export const clearWaveform = (canvas: HTMLCanvasElement): void => {
  decodeAbortFlag = true;
  cachedPeaks = null;

  const ctx = canvas.getContext("2d");
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
};

export const syncWaveformPlayhead = (canvas: HTMLCanvasElement, progressFraction: number): void => {
  if (!cachedPeaks) return;
  renderWaveform(canvas, cachedPeaks, progressFraction, getAccentColor());
};

// Reads the Bandcamp accent color from the CSS custom property set on :root.
const getAccentColor = (): string => {
  const color = getComputedStyle(document.documentElement).getPropertyValue("--band-color").trim();
  return color || "#1da0c3";
};
