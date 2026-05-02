import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/shared/logger", () => ({ logger: vi.fn(), CPL: { WARN: "WARN" } }));

import { AudioVisualizerAdapter } from "@/infra/adapters/visualizer";
import { logger } from "@/shared/logger";

const RAF_HANDLE = 42;

const mockSourceConnect = vi.fn();
const mockSourceDisconnect = vi.fn();
const mockAnalyserConnect = vi.fn();
const mockAnalyserDisconnect = vi.fn();
const mockGetByteFrequencyData = vi.fn();
const mockCreateMediaElementSource = vi.fn();
const mockClose = vi.fn();
const mockRaf = vi.fn();
const mockCancelRaf = vi.fn();

const fakeAnalyser = {
  connect: mockAnalyserConnect,
  disconnect: mockAnalyserDisconnect,
  getByteFrequencyData: mockGetByteFrequencyData,
  frequencyBinCount: 128,
  fftSize: 0,
  smoothingTimeConstant: 0,
};

const fakeSource = { connect: mockSourceConnect, disconnect: mockSourceDisconnect };

// canvas.getContext returns null → drawing exits early; keeps tests focused on audio graph only
const fakeCanvas = { getContext: vi.fn().mockReturnValue(null) } as unknown as HTMLCanvasElement;
const fakeAudioEl = {} as HTMLAudioElement;

beforeEach(() => {
  vi.clearAllMocks();

  mockClose.mockResolvedValue(undefined);
  mockCreateMediaElementSource.mockReturnValue(fakeSource);
  mockRaf.mockReturnValue(RAF_HANDLE);

  vi.stubGlobal(
    "AudioContext",
    class {
      destination = {};
      createAnalyser = () => fakeAnalyser;
      createMediaElementSource = mockCreateMediaElementSource;
      close = mockClose;
    } as unknown as typeof AudioContext
  );
  vi.stubGlobal("requestAnimationFrame", mockRaf);
  vi.stubGlobal("cancelAnimationFrame", mockCancelRaf);
});

afterEach(() => vi.unstubAllGlobals());

describe("start", () => {
  it("creates the audio graph: source → analyser → destination", () => {
    const adapter = new AudioVisualizerAdapter();
    adapter.start(fakeAudioEl, fakeCanvas);

    expect(mockCreateMediaElementSource).toHaveBeenCalledWith(fakeAudioEl);
    expect(mockSourceConnect).toHaveBeenCalledWith(fakeAnalyser);
    expect(mockAnalyserConnect).toHaveBeenCalled();
  });

  it("configures the analyser with the expected fftSize and smoothingTimeConstant", () => {
    const adapter = new AudioVisualizerAdapter();
    adapter.start(fakeAudioEl, fakeCanvas);

    expect(fakeAnalyser.fftSize).toBe(256);
    expect(fakeAnalyser.smoothingTimeConstant).toBe(0.8);
  });

  it("starts the requestAnimationFrame draw loop", () => {
    const adapter = new AudioVisualizerAdapter();
    adapter.start(fakeAudioEl, fakeCanvas);

    expect(mockRaf).toHaveBeenCalledOnce();
  });

  it("sets isRunning to true after start", () => {
    const adapter = new AudioVisualizerAdapter();
    expect(adapter.isRunning()).toBe(false);

    adapter.start(fakeAudioEl, fakeCanvas);

    expect(adapter.isRunning()).toBe(true);
  });

  it("stops the previous session before starting a new one (double-start guard)", () => {
    const adapter = new AudioVisualizerAdapter();
    adapter.start(fakeAudioEl, fakeCanvas);
    adapter.start(fakeAudioEl, fakeCanvas);

    expect(mockCancelRaf).toHaveBeenCalledWith(RAF_HANDLE);
    expect(adapter.isRunning()).toBe(true);
  });

  it("catches a CORS error, logs a warning, and leaves isRunning false", () => {
    mockCreateMediaElementSource.mockImplementation(() => {
      throw new DOMException("CORS policy", "SecurityError");
    });

    const adapter = new AudioVisualizerAdapter();
    adapter.start(fakeAudioEl, fakeCanvas);

    expect(adapter.isRunning()).toBe(false);
    expect(logger).toHaveBeenCalledWith("WARN", "WARN__VISUALIZER__CORS_BLOCKED");
    expect(mockRaf).not.toHaveBeenCalled();
  });
});

describe("stop", () => {
  it("cancels the rAF loop with the correct handle", () => {
    const adapter = new AudioVisualizerAdapter();
    adapter.start(fakeAudioEl, fakeCanvas);
    adapter.stop();

    expect(mockCancelRaf).toHaveBeenCalledWith(RAF_HANDLE);
  });

  it("disconnects source and analyser nodes", () => {
    const adapter = new AudioVisualizerAdapter();
    adapter.start(fakeAudioEl, fakeCanvas);
    adapter.stop();

    expect(mockSourceDisconnect).toHaveBeenCalledOnce();
    expect(mockAnalyserDisconnect).toHaveBeenCalledOnce();
  });

  it("closes the AudioContext", () => {
    const adapter = new AudioVisualizerAdapter();
    adapter.start(fakeAudioEl, fakeCanvas);
    adapter.stop();

    expect(mockClose).toHaveBeenCalledOnce();
  });

  it("sets isRunning to false after stop", () => {
    const adapter = new AudioVisualizerAdapter();
    adapter.start(fakeAudioEl, fakeCanvas);
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
    adapter.start(fakeAudioEl, fakeCanvas);
    expect(adapter.isRunning()).toBe(true);
    adapter.stop();
    expect(adapter.isRunning()).toBe(false);
  });
});
