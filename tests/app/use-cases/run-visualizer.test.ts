import { beforeEach, describe, expect, it, vi } from "vitest";

import { PLUME_DEFAULTS } from "@/domain/plume";
import { FakeAppCore } from "../../fakes/FakeAppCore";

const mockStart = vi.fn();
const mockStop = vi.fn();
const mockGetTrackAudioInfos = vi.fn();

let fakeAppCore = new FakeAppCore();

vi.mock("@/app/stores/AppCoreImpl", () => ({ getAppCoreInstance: () => fakeAppCore }));
vi.mock("@/app/stores/adapters", () => ({
  getVisualizerInstance: () => ({ start: mockStart, stop: mockStop }),
  getTrackAudioInstance: () => ({ getTrackAudioInfos: mockGetTrackAudioInfos }),
}));

import { runVisualizer, stopVisualizer } from "@/app/use-cases/run-visualizer";

const TRACK_URL = "https://bandcamp.com/track/1";
const fakeCanvas = {} as HTMLCanvasElement;

beforeEach(() => {
  vi.clearAllMocks();
  fakeAppCore = new FakeAppCore({ featureFlags: { ...PLUME_DEFAULTS.featureFlags, visualizer: true } });
  mockGetTrackAudioInfos.mockReturnValue([]);
});

describe("runVisualizer", () => {
  it("calls start with the canvas and default BPM (120) when no BPM is detected", () => {
    runVisualizer(fakeCanvas);

    expect(mockStart).toHaveBeenCalledOnce();
    expect(mockStart).toHaveBeenCalledWith(fakeCanvas, 120);
  });

  it("calls start with the detected BPM for the current track", () => {
    fakeAppCore = new FakeAppCore({
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, visualizer: true },
      trackNumber: "1/12",
      trackBpms: { [TRACK_URL]: { bpm: 140, loading: false, error: false } },
    });
    mockGetTrackAudioInfos.mockReturnValue([{ trackNumber: 1, trackUrl: TRACK_URL, audioStreamUrl: "" }]);

    runVisualizer(fakeCanvas);

    expect(mockStart).toHaveBeenCalledWith(fakeCanvas, 140);
  });

  it("falls back to default BPM when track is known but BPM entry is null", () => {
    fakeAppCore = new FakeAppCore({
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, visualizer: true },
      trackNumber: "1/12",
      trackBpms: { [TRACK_URL]: { bpm: null, loading: true, error: false } },
    });
    mockGetTrackAudioInfos.mockReturnValue([{ trackNumber: 1, trackUrl: TRACK_URL, audioStreamUrl: "" }]);

    runVisualizer(fakeCanvas);

    expect(mockStart).toHaveBeenCalledWith(fakeCanvas, 120);
  });

  it("is a no-op when featureFlags.visualizer is false", () => {
    fakeAppCore = new FakeAppCore({ featureFlags: { ...PLUME_DEFAULTS.featureFlags, visualizer: false } });

    runVisualizer(fakeCanvas);

    expect(mockStart).not.toHaveBeenCalled();
  });
});

describe("stopVisualizer", () => {
  it("calls stop on the visualizer instance", () => {
    stopVisualizer();

    expect(mockStop).toHaveBeenCalledOnce();
  });
});
