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
let capturedDrawCb: ((ts: number) => void) | null = null;

beforeEach(() => {
  vi.clearAllMocks();
  capturedDrawCb = null;

  mockGetContext.mockReturnValue(fakeCanvasCtx);
  mockRaf.mockImplementation((cb: (ts: number) => void) => {
    capturedDrawCb = cb;
    return RAF_HANDLE;
  });

  vi.stubGlobal("requestAnimationFrame", mockRaf);
  vi.stubGlobal("cancelAnimationFrame", mockCancelRaf);
});

afterEach(() => vi.unstubAllGlobals());

describe("start", () => {
  it("starts the requestAnimationFrame draw loop", () => {
    const adapter = new AudioVisualizerAdapter();
    adapter.start(fakeCanvas, 120);

    expect(mockRaf).toHaveBeenCalledOnce();
  });

  it("sets isRunning to true after start", () => {
    const adapter = new AudioVisualizerAdapter();
    expect(adapter.isRunning()).toBe(false);

    adapter.start(fakeCanvas, 120);

    expect(adapter.isRunning()).toBe(true);
  });

  it("stops the previous session before starting a new one (double-start guard)", () => {
    const adapter = new AudioVisualizerAdapter();
    adapter.start(fakeCanvas, 120);
    adapter.start(fakeCanvas, 140);

    expect(mockCancelRaf).toHaveBeenCalledWith(RAF_HANDLE);
    expect(adapter.isRunning()).toBe(true);
  });

  it("clears the canvas and draws one bar per frequency bucket on each frame", () => {
    const adapter = new AudioVisualizerAdapter();
    adapter.start(fakeCanvas, 120);
    capturedDrawCb!(10); // 10 ms into beat — positive energy

    expect(mockClearRect).toHaveBeenCalledWith(0, 0, 200, 100);
    expect(mockFillRect).toHaveBeenCalledTimes(64); // one call per BAR_COUNT bar
  });

  it("schedules the next frame from within the draw callback", () => {
    const adapter = new AudioVisualizerAdapter();
    adapter.start(fakeCanvas, 120);
    capturedDrawCb!(10); // inside draw(), requestAnimationFrame is called again

    expect(mockRaf).toHaveBeenCalledTimes(2);
  });

  it("skips drawing when canvas context is unavailable", () => {
    mockGetContext.mockReturnValue(null);

    const adapter = new AudioVisualizerAdapter();
    adapter.start(fakeCanvas, 120);
    capturedDrawCb!(10);

    expect(mockClearRect).not.toHaveBeenCalled();
    expect(mockFillRect).not.toHaveBeenCalled();
  });
});

describe("stop", () => {
  it("cancels the rAF loop with the correct handle", () => {
    const adapter = new AudioVisualizerAdapter();
    adapter.start(fakeCanvas, 120);
    adapter.stop();

    expect(mockCancelRaf).toHaveBeenCalledWith(RAF_HANDLE);
  });

  it("sets isRunning to false after stop", () => {
    const adapter = new AudioVisualizerAdapter();
    adapter.start(fakeCanvas, 120);
    adapter.stop();

    expect(adapter.isRunning()).toBe(false);
  });

  it("is safe to call when never started (no throw, no rAF cancel)", () => {
    const adapter = new AudioVisualizerAdapter();

    expect(() => adapter.stop()).not.toThrow();
    expect(mockCancelRaf).not.toHaveBeenCalled();
  });
});

describe("isRunning", () => {
  it("returns false on a fresh adapter", () => {
    expect(new AudioVisualizerAdapter().isRunning()).toBe(false);
  });

  it("returns true between start and stop", () => {
    const adapter = new AudioVisualizerAdapter();
    adapter.start(fakeCanvas, 120);
    expect(adapter.isRunning()).toBe(true);
    adapter.stop();
    expect(adapter.isRunning()).toBe(false);
  });
});
