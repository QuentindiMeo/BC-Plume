// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PLUME_DEFAULTS } from "@/domain/plume";
import { FakeAppCore } from "../../../fakes/FakeAppCore";

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockDecodeWaveformForCurrentTrack = vi.hoisted(() => vi.fn());

vi.mock("@/app/use-cases/decode-waveform", () => ({
  decodeWaveformForCurrentTrack: mockDecodeWaveformForCurrentTrack,
}));
vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));

let fakeAppCore = new FakeAppCore();
vi.mock("@/app/stores/AppCoreImpl", () => ({ getAppCoreInstance: () => fakeAppCore }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Import SUT after mocks are declared ─────────────────────────────────────

import {
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

  // Always reset module-level cache by clearing on a dummy canvas
  clearWaveform(makeCanvas());
});

// ─── createWaveformCanvas ────────────────────────────────────────────────────

describe("createWaveformCanvas", () => {
  it("returns a canvas element with the correct id", () => {
    const canvas = createWaveformCanvas();

    expect(canvas.tagName).toBe("CANVAS");
    expect(canvas.id).toBe("plume-waveform-canvas");
  });

  it("is hidden when the waveform feature flag is off", () => {
    const canvas = createWaveformCanvas();

    expect(canvas.classList.contains("plume-feature-hidden")).toBe(true);
  });

  it("is visible when the waveform feature flag is on", () => {
    fakeAppCore = new FakeAppCore({
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, waveform: true },
    });

    const canvas = createWaveformCanvas();

    expect(canvas.classList.contains("plume-feature-hidden")).toBe(false);
  });

  it("has an aria-label set", () => {
    const canvas = createWaveformCanvas();

    expect(canvas.ariaLabel).toBeTruthy();
  });
});

// ─── renderWaveform ───────────────────────────────────────────────────────────

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
});

// ─── clearWaveform ────────────────────────────────────────────────────────────

describe("clearWaveform", () => {
  it("calls clearRect on the canvas context", () => {
    const canvas = makeCanvas();
    const ctx = makeMockCtx();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    clearWaveform(canvas);

    expect(ctx.clearRect).toHaveBeenCalledOnce();
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

// ─── syncWaveformPlayhead ─────────────────────────────────────────────────────

describe("syncWaveformPlayhead", () => {
  it("is a no-op when no peaks are cached", () => {
    const canvas = makeCanvas();
    const ctx = makeMockCtx();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    syncWaveformPlayhead(canvas, 0.5);

    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it("renders when peaks are cached after triggerWaveformDecode", async () => {
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

// ─── triggerWaveformDecode ────────────────────────────────────────────────────

describe("triggerWaveformDecode", () => {
  it("removes plume-feature-hidden on successful decode", async () => {
    mockDecodeWaveformForCurrentTrack.mockResolvedValue(fakePeaks);
    const canvas = makeCanvas();
    canvas.classList.add("plume-feature-hidden");
    vi.spyOn(canvas, "getContext").mockReturnValue(makeMockCtx() as unknown as CanvasRenderingContext2D);

    await triggerWaveformDecode(canvas);

    expect(canvas.classList.contains("plume-feature-hidden")).toBe(false);
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
    canvas.classList.add("plume-feature-hidden");
    const ctx = makeMockCtx();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    await triggerWaveformDecode(canvas);

    expect(canvas.classList.contains("plume-feature-hidden")).toBe(true);
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

  it("skips decode and renders immediately when peaks are already cached (fast path)", async () => {
    mockDecodeWaveformForCurrentTrack.mockResolvedValue(fakePeaks);

    // First call seeds the cache
    const canvas1 = makeCanvas();
    vi.spyOn(canvas1, "getContext").mockReturnValue(makeMockCtx() as unknown as CanvasRenderingContext2D);
    await triggerWaveformDecode(canvas1);
    mockDecodeWaveformForCurrentTrack.mockClear();

    // Second call should use cache without decoding
    const canvas2 = makeCanvas();
    const ctx2 = makeMockCtx();
    vi.spyOn(canvas2, "getContext").mockReturnValue(ctx2 as unknown as CanvasRenderingContext2D);
    await triggerWaveformDecode(canvas2);

    expect(mockDecodeWaveformForCurrentTrack).not.toHaveBeenCalled();
    expect(ctx2.fillRect).toHaveBeenCalledTimes(PEAK_COUNT);
  });
});
