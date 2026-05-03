import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AudioVisualizerAdapter } from "@/infra/adapters/visualizer";

const RAF_HANDLE = 42;

const mockClearRect = vi.fn();
const mockFillRect = vi.fn();
const mockGetContext = vi.fn();
const mockRaf = vi.fn();
const mockCancelRaf = vi.fn();

const fakeCanvasCtx = { clearRect: mockClearRect, fillRect: mockFillRect, fillStyle: "" };

const fakeCanvas = {
  getContext: mockGetContext,
  width: 200,
  height: 100,
} as unknown as HTMLCanvasElement;

// Capture the draw callback so individual tests can invoke it to simulate a frame
let capturedDrawCallback: ((timestamp: number) => void) | null = null;

beforeEach(() => {
  vi.clearAllMocks();
  capturedDrawCallback = null;

  mockGetContext.mockReturnValue(fakeCanvasCtx);
  mockRaf.mockImplementation((callback: (timestamp: number) => void) => {
    capturedDrawCallback = callback;
    return RAF_HANDLE;
  });

  vi.stubGlobal("requestAnimationFrame", mockRaf);
  vi.stubGlobal("cancelAnimationFrame", mockCancelRaf);
});

afterEach(() => vi.unstubAllGlobals());

describe("start", () => {
  it("starts the requestAnimationFrame draw loop", () => {
    const viz = new AudioVisualizerAdapter();
    viz.start(fakeCanvas, 120, 0);

    expect(mockRaf).toHaveBeenCalledOnce();
  });

  it("sets isRunning to true after start", () => {
    const viz = new AudioVisualizerAdapter();
    expect(viz.isRunning()).toBe(false);

    viz.start(fakeCanvas, 120, 0);

    expect(viz.isRunning()).toBe(true);
  });

  it("stops the previous session before starting a new one (double-start guard)", () => {
    const viz = new AudioVisualizerAdapter();
    viz.start(fakeCanvas, 120, 0);
    viz.start(fakeCanvas, 140, 0);

    expect(mockCancelRaf).toHaveBeenCalledWith(RAF_HANDLE);
    expect(viz.isRunning()).toBe(true);
  });

  it("clears the canvas and draws one bar per frequency bucket on each frame", () => {
    const viz = new AudioVisualizerAdapter();
    viz.start(fakeCanvas, 120, 0);
    capturedDrawCallback!(10); // 10 ms into beat — positive energy

    expect(mockClearRect).toHaveBeenCalledWith(0, 0, 200, 100);
    expect(mockFillRect).toHaveBeenCalledTimes(64); // one call per BAR_COUNT bar
  });

  it("schedules the next frame from within the draw callback", () => {
    const viz = new AudioVisualizerAdapter();
    viz.start(fakeCanvas, 120, 0);
    capturedDrawCallback!(10); // inside draw(), requestAnimationFrame is called again

    expect(mockRaf).toHaveBeenCalledTimes(2);
  });

  it("skips drawing when canvas context is unavailable", () => {
    mockGetContext.mockReturnValue(null);

    const viz = new AudioVisualizerAdapter();
    viz.start(fakeCanvas, 120, 0);
    capturedDrawCallback!(10);

    expect(mockClearRect).not.toHaveBeenCalled();
    expect(mockFillRect).not.toHaveBeenCalled();
  });

  it("anchors beat phase to the given audioTime — drawing at audioTime offset produces same energy as at t=0", () => {
    // 120 BPM → beatInterval = 500ms. At timestamp=0 with audioTime=0, phase=0 → peak energy.
    // At timestamp=500 with audioTime=0, phase=0 again (next beat) → same peak.
    // If audioTime=1 (1000ms offset): refTimestamp = firstTs - 1000.
    //   audioMs = firstTs - refTimestamp = 1000ms.
    //   At firstTs=0: refTimestamp = -1000, audioMs = 1000ms → phase = (1000 % 500) / 500 = 0 → peak.
    // So two adapters started at audioTime=0 and audioTime=1 should produce the same bar heights
    // when called with timestamps 0 and 1000 respectively (both land on beat boundary).

    const ctxA = { clearRect: vi.fn(), fillRect: vi.fn(), fillStyle: "" };
    const ctxB = { clearRect: vi.fn(), fillRect: vi.fn(), fillStyle: "" };
    const canvasA = { getContext: () => ctxA, width: 200, height: 100 } as unknown as HTMLCanvasElement;
    const canvasB = { getContext: () => ctxB, width: 200, height: 100 } as unknown as HTMLCanvasElement;

    const adapterA = new AudioVisualizerAdapter();
    adapterA.start(canvasA, 120, 0); // audioTime = 0s
    const cbA = capturedDrawCallback!;
    cbA(0); // first frame at timestamp=0 → audioMs=0 → phase=0

    const adapterB = new AudioVisualizerAdapter();
    adapterB.start(canvasB, 120, 1); // audioTime = 1s (1000ms)
    const cbB = capturedDrawCallback!;
    cbB(0); // first frame at timestamp=0 → refTimestamp = 0 - 1000 = -1000 → audioMs=1000 → phase=0

    // Both land on a beat boundary (phase=0): bar heights should be identical
    expect(ctxA.fillRect.mock.calls).toEqual(ctxB.fillRect.mock.calls);
  });
});

describe("stop", () => {
  it("cancels the rAF loop with the correct handle", () => {
    const viz = new AudioVisualizerAdapter();
    viz.start(fakeCanvas, 120, 0);
    viz.stop();

    expect(mockCancelRaf).toHaveBeenCalledWith(RAF_HANDLE);
  });

  it("sets isRunning to false after stop", () => {
    const viz = new AudioVisualizerAdapter();
    viz.start(fakeCanvas, 120, 0);
    viz.stop();

    expect(viz.isRunning()).toBe(false);
  });

  it("is safe to call when never started (no throw, no rAF cancel)", () => {
    const viz = new AudioVisualizerAdapter();

    expect(() => viz.stop()).not.toThrow();
    expect(mockCancelRaf).not.toHaveBeenCalled();
  });
});

describe("isRunning", () => {
  it("returns false on a fresh adapter", () => {
    expect(new AudioVisualizerAdapter().isRunning()).toBe(false);
  });

  it("returns true between start and stop", () => {
    const viz = new AudioVisualizerAdapter();
    viz.start(fakeCanvas, 120, 0);
    expect(viz.isRunning()).toBe(true);
    viz.stop();
    expect(viz.isRunning()).toBe(false);
  });
});
