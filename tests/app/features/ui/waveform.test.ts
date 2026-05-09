// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PLUME_CONSTANTS, PLUME_DEFAULTS } from "@/domain/plume";
import { PLUME_CSS_CLASSES } from "@/infra/elements/plume";
import { FakeAppCore } from "../../../fakes/FakeAppCore";

const mockDecodeWaveformForCurrentTrack = vi.hoisted(() => vi.fn());
const mockSeekToProgress = vi.hoisted(() => vi.fn());

vi.mock("@/app/use-cases/decode-waveform", () => ({
  decodeWaveformForCurrentTrack: mockDecodeWaveformForCurrentTrack,
}));
vi.mock("@/app/use-cases", () => ({ seekToProgress: mockSeekToProgress }));
vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));

const fakeMusicPlayer = {};
vi.mock("@/app/stores/adapters", () => ({ getMusicPlayerInstance: () => fakeMusicPlayer }));

let fakeAppCore = new FakeAppCore();
vi.mock("@/app/stores/AppCoreImpl", () => ({ getAppCoreInstance: () => fakeAppCore }));

const PEAK_COUNT = 4;
const fakePeaks = new Float32Array([0.2, 0.8, 0.6, 0.4]);

const makeMockCtx = () => ({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  fillStyle: "" as string,
});

/** Build a canvas whose offsetWidth/offsetHeight are non-zero so renderWaveform doesn't bail. */
const makeCanvas = (width = 400, height = 40): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  Object.defineProperty(canvas, "offsetWidth", { value: width, configurable: true });
  Object.defineProperty(canvas, "offsetHeight", { value: height, configurable: true });
  return canvas;
};

import {
  attachWaveformSeekHandler,
  clearPeaksCache,
  clearWaveform,
  createWaveformCanvas,
  renderWaveform,
  syncWaveformPlayhead,
  triggerWaveformDecode,
} from "@/app/features/ui/waveform";

beforeEach(() => {
  vi.clearAllMocks();
  fakeAppCore = new FakeAppCore({
    featureFlags: { ...PLUME_DEFAULTS.featureFlags, waveform: false },
    currentTime: 0,
    duration: 100,
  });
  mockDecodeWaveformForCurrentTrack.mockResolvedValue(null);

  // Reset all module-level state between tests
  clearPeaksCache();
  clearWaveform(makeCanvas()); // resets decodeAbortFlag
});

describe("createWaveformCanvas", () => {
  it("returns a canvas element with the correct id", () => {
    const canvas = createWaveformCanvas();

    expect(canvas.tagName).toBe("CANVAS");
    expect(canvas.id).toBe("plume-waveform-canvas");
  });

  it("is hidden when the waveform feature flag is off", () => {
    const canvas = createWaveformCanvas();

    expect(canvas.classList.contains(PLUME_CSS_CLASSES.featureHidden)).toBe(true);
  });

  it("is visible when the waveform feature flag is on", () => {
    fakeAppCore = new FakeAppCore({
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, waveform: true },
    });

    const canvas = createWaveformCanvas();

    expect(canvas.classList.contains(PLUME_CSS_CLASSES.featureHidden)).toBe(false);
  });

  it("has an aria-label set", () => {
    const canvas = createWaveformCanvas();

    expect(canvas.ariaLabel).toBeTruthy();
  });
});

describe("renderWaveform", () => {
  it("calls fillRect exactly once per peak", () => {
    const canvas = makeCanvas();
    const ctx = makeMockCtx();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    renderWaveform(canvas, fakePeaks, 0, "#ff0000");

    expect(ctx.fillRect).toHaveBeenCalledTimes(PEAK_COUNT);
  });

  it("colors bars before progressFraction with accent color", () => {
    const canvas = makeCanvas();
    const ctx = makeMockCtx();
    const filledColors: string[] = [];
    Object.defineProperty(ctx, "fillStyle", {
      set(v: string) {
        filledColors.push(v);
      },
      get() {
        return "";
      },
    });
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    // progressFraction = 0.5 → first 2 of 4 columns played
    renderWaveform(canvas, fakePeaks, 0.5, "#ff0000");

    expect(filledColors[0]).toBe("#ff0000");
    expect(filledColors[1]).toBe("#ff0000");
    expect(filledColors[2]).not.toBe("#ff0000");
    expect(filledColors[3]).not.toBe("#ff0000");
  });

  it("calls clearRect before drawing", () => {
    const canvas = makeCanvas();
    const ctx = makeMockCtx();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    renderWaveform(canvas, fakePeaks, 0, "#ff0000");

    expect(ctx.clearRect).toHaveBeenCalledOnce();
  });

  it("is a no-op when the canvas has zero dimensions", () => {
    const canvas = makeCanvas(0, 0);
    const ctx = makeMockCtx();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    renderWaveform(canvas, fakePeaks, 0, "#ff0000");

    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it("uses muted color for all bars when progressFraction is 0", () => {
    const canvas = makeCanvas();
    const ctx = makeMockCtx();
    const filledColors: string[] = [];
    Object.defineProperty(ctx, "fillStyle", {
      set(v: string) {
        filledColors.push(v);
      },
      get() {
        return "";
      },
    });
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    renderWaveform(canvas, fakePeaks, 0, "#ff0000");

    expect(filledColors.every((c) => c !== "#ff0000")).toBe(true);
  });

  it("uses accent color for all bars when progressFraction is 1", () => {
    const canvas = makeCanvas();
    const ctx = makeMockCtx();
    const filledColors: string[] = [];
    Object.defineProperty(ctx, "fillStyle", {
      set(v: string) {
        filledColors.push(v);
      },
      get() {
        return "";
      },
    });
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    renderWaveform(canvas, fakePeaks, 1, "#ff0000");

    expect(filledColors.every((c) => c === "#ff0000")).toBe(true);
  });

  it("handles empty peaks without throwing and draws nothing", () => {
    const canvas = makeCanvas();
    const ctx = makeMockCtx();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    expect(() => renderWaveform(canvas, new Float32Array(0), 0, "#ff0000")).not.toThrow();
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });
});

describe("clearWaveform", () => {
  it("calls clearRect on the canvas context", () => {
    const canvas = makeCanvas();
    const ctx = makeMockCtx();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    clearWaveform(canvas);

    expect(ctx.clearRect).toHaveBeenCalledOnce();
  });

  it("adds plume-feature-hidden to the canvas", () => {
    const canvas = makeCanvas();
    const ctx = makeMockCtx();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    canvas.classList.remove(PLUME_CSS_CLASSES.featureHidden);

    clearWaveform(canvas);

    expect(canvas.classList.contains(PLUME_CSS_CLASSES.featureHidden)).toBe(true);
  });

  it("makes syncWaveformPlayhead a no-op (peaks cleared)", () => {
    // First seed peaks via triggerWaveformDecode, then clear
    const canvas = makeCanvas();
    const ctx = makeMockCtx();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    clearWaveform(canvas);
    ctx.fillRect.mockClear();

    syncWaveformPlayhead(canvas, 0.5);

    expect(ctx.fillRect).not.toHaveBeenCalled();
  });
});

describe("syncWaveformPlayhead", () => {
  it("is a no-op when no peaks are cached", () => {
    const canvas = makeCanvas();
    const ctx = makeMockCtx();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    syncWaveformPlayhead(canvas, 0.5);

    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it("renders when peaks are cached after triggerWaveformDecode", async () => {
    fakeAppCore = new FakeAppCore({
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, waveform: true },
      currentTime: 0,
      duration: 100,
    });
    mockDecodeWaveformForCurrentTrack.mockResolvedValue(fakePeaks);

    const canvas = makeCanvas();
    const ctx = makeMockCtx();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    await triggerWaveformDecode(canvas);
    ctx.fillRect.mockClear();

    syncWaveformPlayhead(canvas, 0.5);

    expect(ctx.fillRect).toHaveBeenCalledTimes(PEAK_COUNT);
  });
});

describe("triggerWaveformDecode", () => {
  beforeEach(() => {
    fakeAppCore = new FakeAppCore({
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, waveform: true },
      currentTime: 0,
      duration: 100,
    });
  });

  it("removes plume-feature-hidden on successful decode", async () => {
    mockDecodeWaveformForCurrentTrack.mockResolvedValue(fakePeaks);
    const canvas = makeCanvas();
    canvas.classList.add(PLUME_CSS_CLASSES.featureHidden);
    vi.spyOn(canvas, "getContext").mockReturnValue(makeMockCtx() as unknown as CanvasRenderingContext2D);

    await triggerWaveformDecode(canvas);

    expect(canvas.classList.contains(PLUME_CSS_CLASSES.featureHidden)).toBe(false);
  });

  it("calls renderWaveform (fillRect N times) after decode succeeds", async () => {
    mockDecodeWaveformForCurrentTrack.mockResolvedValue(fakePeaks);
    const canvas = makeCanvas();
    const ctx = makeMockCtx();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    await triggerWaveformDecode(canvas);

    expect(ctx.fillRect).toHaveBeenCalledTimes(PEAK_COUNT);
  });

  it("does not render and does not remove hidden class when decode returns null", async () => {
    mockDecodeWaveformForCurrentTrack.mockResolvedValue(null);
    const canvas = makeCanvas();
    canvas.classList.add(PLUME_CSS_CLASSES.featureHidden);
    const ctx = makeMockCtx();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    await triggerWaveformDecode(canvas);

    expect(canvas.classList.contains(PLUME_CSS_CLASSES.featureHidden)).toBe(true);
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it("discards result when clearWaveform is called during an in-flight decode", async () => {
    let resolveDecode!: (peaks: Float32Array | null) => void;
    mockDecodeWaveformForCurrentTrack.mockReturnValue(new Promise((r) => (resolveDecode = r)));

    const canvas = makeCanvas();
    const ctx = makeMockCtx();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    const decodePromise = triggerWaveformDecode(canvas);
    clearWaveform(canvas); // abort before resolve
    resolveDecode(fakePeaks);
    await decodePromise;

    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it("skips decode and renders immediately when peaks are already cached (fast-path)", async () => {
    mockDecodeWaveformForCurrentTrack.mockResolvedValue(fakePeaks);

    // First call seeds the cache
    const canvas1 = makeCanvas();
    vi.spyOn(canvas1, "getContext").mockReturnValue(makeMockCtx() as unknown as CanvasRenderingContext2D);
    await triggerWaveformDecode(canvas1);
    mockDecodeWaveformForCurrentTrack.mockClear();

    // Simulate track navigation: clearWaveform hides display but preserves cache
    clearWaveform(canvas1);

    // Second call for the same track uses cache — no decode
    const canvas2 = makeCanvas();
    const ctx2 = makeMockCtx();
    vi.spyOn(canvas2, "getContext").mockReturnValue(ctx2 as unknown as CanvasRenderingContext2D);
    await triggerWaveformDecode(canvas2);

    expect(mockDecodeWaveformForCurrentTrack).not.toHaveBeenCalled();
    expect(ctx2.fillRect).toHaveBeenCalledTimes(PEAK_COUNT);
  });

  it("uses fast path on a second call to the same canvas without clearWaveform between", async () => {
    mockDecodeWaveformForCurrentTrack.mockResolvedValue(fakePeaks);

    const canvas = makeCanvas();
    const ctx = makeMockCtx();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    await triggerWaveformDecode(canvas);
    mockDecodeWaveformForCurrentTrack.mockClear();
    ctx.fillRect.mockClear();

    await triggerWaveformDecode(canvas);

    expect(mockDecodeWaveformForCurrentTrack).not.toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalledTimes(PEAK_COUNT);
  });

  it("keeps canvas hidden and does not decode when featureFlags.waveform is false", async () => {
    fakeAppCore = new FakeAppCore({
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, waveform: false },
      currentTime: 0,
      duration: 100,
    });
    const canvas = makeCanvas();
    canvas.classList.remove(PLUME_CSS_CLASSES.featureHidden);

    await triggerWaveformDecode(canvas);

    expect(canvas.classList.contains(PLUME_CSS_CLASSES.featureHidden)).toBe(true);
    expect(mockDecodeWaveformForCurrentTrack).not.toHaveBeenCalled();
  });

  it("hides canvas without decoding when featureFlags.waveform is false even with cached peaks", async () => {
    // Seed the cache while flag is on (inherited from nested beforeEach)
    mockDecodeWaveformForCurrentTrack.mockResolvedValue(fakePeaks);
    const seedCanvas = makeCanvas();
    vi.spyOn(seedCanvas, "getContext").mockReturnValue(makeMockCtx() as unknown as CanvasRenderingContext2D);
    await triggerWaveformDecode(seedCanvas);
    mockDecodeWaveformForCurrentTrack.mockClear();

    // Now disable the flag — guard must run before the fast path
    fakeAppCore = new FakeAppCore({
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, waveform: false },
      currentTime: 0,
      duration: 100,
    });
    const canvas = makeCanvas();
    canvas.classList.remove(PLUME_CSS_CLASSES.featureHidden);

    await triggerWaveformDecode(canvas);

    expect(canvas.classList.contains(PLUME_CSS_CLASSES.featureHidden)).toBe(true);
    expect(mockDecodeWaveformForCurrentTrack).not.toHaveBeenCalled();
  });

  it("keeps canvas hidden and skips fetch when duration exceeds WAVEFORM_MAX_DURATION_SECS", async () => {
    fakeAppCore = new FakeAppCore({
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, waveform: true },
      currentTime: 0,
      duration: PLUME_CONSTANTS.WAVEFORM_MAX_DURATION_SECONDS + 1,
    });
    const canvas = makeCanvas();
    canvas.classList.remove(PLUME_CSS_CLASSES.featureHidden);

    await triggerWaveformDecode(canvas);

    expect(canvas.classList.contains(PLUME_CSS_CLASSES.featureHidden)).toBe(true);
    expect(mockDecodeWaveformForCurrentTrack).not.toHaveBeenCalled();
  });

  it("proceeds with decode when duration equals WAVEFORM_MAX_DURATION_SECS exactly", async () => {
    fakeAppCore = new FakeAppCore({
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, waveform: true },
      currentTime: 0,
      duration: PLUME_CONSTANTS.WAVEFORM_MAX_DURATION_SECONDS,
    });
    mockDecodeWaveformForCurrentTrack.mockResolvedValue(fakePeaks);
    const canvas = makeCanvas();
    const ctx = makeMockCtx();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    await triggerWaveformDecode(canvas);

    expect(mockDecodeWaveformForCurrentTrack).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalledTimes(PEAK_COUNT);
  });
});

describe("loading state", () => {
  beforeEach(() => {
    fakeAppCore = new FakeAppCore({
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, waveform: true },
      currentTime: 0,
      duration: 100,
    });
  });

  it("shows canvas with loading class while decode is in progress, removes it after", async () => {
    let resolveDecode!: (peaks: Float32Array | null) => void;
    mockDecodeWaveformForCurrentTrack.mockReturnValue(new Promise((r) => (resolveDecode = r)));

    const canvas = makeCanvas();
    canvas.classList.add(PLUME_CSS_CLASSES.featureHidden);
    vi.spyOn(canvas, "getContext").mockReturnValue(makeMockCtx() as unknown as CanvasRenderingContext2D);

    const promise = triggerWaveformDecode(canvas);

    // Synchronous portion has run: canvas visible, loading class present
    expect(canvas.classList.contains(PLUME_CSS_CLASSES.featureHidden)).toBe(false);
    expect(canvas.classList.contains(PLUME_CSS_CLASSES.waveformLoading)).toBe(true);

    resolveDecode(fakePeaks);
    await promise;

    // After decode: loading class removed, canvas stays visible
    expect(canvas.classList.contains(PLUME_CSS_CLASSES.waveformLoading)).toBe(false);
    expect(canvas.classList.contains(PLUME_CSS_CLASSES.featureHidden)).toBe(false);
  });

  it("removes loading class and hides canvas when decode is aborted", async () => {
    let resolveDecode!: (peaks: Float32Array | null) => void;
    mockDecodeWaveformForCurrentTrack.mockReturnValue(new Promise((r) => (resolveDecode = r)));

    const canvas = makeCanvas();
    vi.spyOn(canvas, "getContext").mockReturnValue(makeMockCtx() as unknown as CanvasRenderingContext2D);

    const promise = triggerWaveformDecode(canvas);
    clearWaveform(canvas);
    resolveDecode(fakePeaks);
    await promise;

    expect(canvas.classList.contains(PLUME_CSS_CLASSES.waveformLoading)).toBe(false);
    expect(canvas.classList.contains(PLUME_CSS_CLASSES.featureHidden)).toBe(true);
  });
});

describe("attachWaveformSeekHandler", () => {
  const mockRect = (left: number, width: number): DOMRect =>
    ({ left, width, top: 0, bottom: 40, right: left + width, height: 40, x: left, y: 0, toJSON: () => {} }) as DOMRect;

  it("calls seekToProgress with fraction × PROGRESS_SLIDER_GRANULARITY on click", () => {
    const canvas = makeCanvas(400, 40);
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue(mockRect(0, 400));

    attachWaveformSeekHandler(canvas);
    canvas.dispatchEvent(new MouseEvent("click", { clientX: 200, bubbles: true }));

    expect(mockSeekToProgress).toHaveBeenCalledWith(
      0.5 * PLUME_CONSTANTS.PROGRESS_SLIDER_GRANULARITY,
      expect.anything(),
      fakeMusicPlayer
    );
  });

  it("clamps fraction to 0 when clicking before the left edge", () => {
    const canvas = makeCanvas(400, 40);
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue(mockRect(100, 400));

    attachWaveformSeekHandler(canvas);
    canvas.dispatchEvent(new MouseEvent("click", { clientX: 50, bubbles: true })); // 50 < left(100)

    expect(mockSeekToProgress).toHaveBeenCalledWith(0, expect.anything(), fakeMusicPlayer);
  });

  it("clamps fraction to PROGRESS_SLIDER_GRANULARITY when clicking past the right edge", () => {
    const canvas = makeCanvas(400, 40);
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue(mockRect(0, 400));

    attachWaveformSeekHandler(canvas);
    canvas.dispatchEvent(new MouseEvent("click", { clientX: 500, bubbles: true })); // 500 > right(400)

    expect(mockSeekToProgress).toHaveBeenCalledWith(
      PLUME_CONSTANTS.PROGRESS_SLIDER_GRANULARITY,
      expect.anything(),
      fakeMusicPlayer
    );
  });
});
