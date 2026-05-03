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

import { runVisualizer, stopVisualizer, syncVisualizerWithPlayback } from "@/app/use-cases/run-visualizer";

const TRACK_URL = "https://bandcamp.com/track/1";
const fakeCanvas = {} as HTMLCanvasElement;

const withBpm = (bpm: number | null, visualizer = true) => {
  fakeAppCore = new FakeAppCore({
    featureFlags: { ...PLUME_DEFAULTS.featureFlags, visualizer },
    trackNumber: "1/12",
    trackBpms: { [TRACK_URL]: { bpm, loading: bpm === null, error: false } },
  });
  mockGetTrackAudioInfos.mockReturnValue([{ trackNumber: 1, trackUrl: TRACK_URL, audioStreamUrl: "" }]);
};

beforeEach(() => {
  vi.clearAllMocks();
  fakeAppCore = new FakeAppCore({ featureFlags: { ...PLUME_DEFAULTS.featureFlags, visualizer: true } });
  mockGetTrackAudioInfos.mockReturnValue([]);
});

describe("runVisualizer", () => {
  it("calls start with the detected BPM for the current track", () => {
    withBpm(140);

    runVisualizer(fakeCanvas);

    expect(mockStart).toHaveBeenCalledWith(fakeCanvas, 140);
  });

  it("is a no-op when BPM has not been detected yet (no trackNumber in state)", () => {
    runVisualizer(fakeCanvas); // default state: no trackNumber

    expect(mockStart).not.toHaveBeenCalled();
  });

  it("is a no-op when BPM entry is null (detection in progress)", () => {
    withBpm(null);

    runVisualizer(fakeCanvas);

    expect(mockStart).not.toHaveBeenCalled();
  });

  it("is a no-op when featureFlags.visualizer is false", () => {
    withBpm(140, false);

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

describe("syncVisualizerWithPlayback", () => {
  it("starts the visualizer with the detected BPM when isPlaying is true", () => {
    withBpm(128);

    syncVisualizerWithPlayback(true, fakeCanvas);

    expect(mockStart).toHaveBeenCalledWith(fakeCanvas, 128);
  });

  it("is a no-op when isPlaying is true but BPM is not yet available", () => {
    syncVisualizerWithPlayback(true, fakeCanvas);

    expect(mockStart).not.toHaveBeenCalled();
  });

  it("stops the visualizer when isPlaying is false", () => {
    syncVisualizerWithPlayback(false, fakeCanvas);

    expect(mockStop).toHaveBeenCalledOnce();
  });

  it("does not start the visualizer when the flag is off", () => {
    withBpm(140, false);

    syncVisualizerWithPlayback(true, fakeCanvas);

    expect(mockStart).not.toHaveBeenCalled();
  });
});
