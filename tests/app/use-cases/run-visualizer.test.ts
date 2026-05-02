import { beforeEach, describe, expect, it, vi } from "vitest";

import { PLUME_DEFAULTS } from "@/domain/plume";
import { FakeAppCore } from "../../fakes/FakeAppCore";

const mockStart = vi.fn();
const mockStop = vi.fn();

let fakeAppCore = new FakeAppCore();
let fakeGui: { getState: () => { audioElement: HTMLAudioElement | null } } = {
  getState: () => ({ audioElement: null }),
};

vi.mock("@/app/stores/AppCoreImpl", () => ({ getAppCoreInstance: () => fakeAppCore }));
vi.mock("@/app/stores/GuiImpl", () => ({ getGuiInstance: () => fakeGui }));
vi.mock("@/app/stores/adapters", () => ({
  getVisualizerInstance: () => ({ start: mockStart, stop: mockStop }),
}));

import { runVisualizer, stopVisualizer } from "@/app/use-cases/run-visualizer";

const fakeAudioElement = {} as HTMLAudioElement;
const fakeCanvas = {} as HTMLCanvasElement;

beforeEach(() => {
  vi.clearAllMocks();
  fakeAppCore = new FakeAppCore({ featureFlags: { ...PLUME_DEFAULTS.featureFlags, visualizer: true } });
  fakeGui = { getState: () => ({ audioElement: fakeAudioElement }) };
});

describe("runVisualizer", () => {
  it("calls start with the audio element and canvas when flag is on and audio is available", () => {
    runVisualizer(fakeCanvas);

    expect(mockStart).toHaveBeenCalledOnce();
    expect(mockStart).toHaveBeenCalledWith(fakeAudioElement, fakeCanvas);
  });

  it("is a no-op when featureFlags.visualizer is false", () => {
    fakeAppCore = new FakeAppCore({ featureFlags: { ...PLUME_DEFAULTS.featureFlags, visualizer: false } });

    runVisualizer(fakeCanvas);

    expect(mockStart).not.toHaveBeenCalled();
  });

  it("is a no-op when audioElement is null", () => {
    fakeGui = { getState: () => ({ audioElement: null }) };

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
