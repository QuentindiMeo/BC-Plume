// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockClearWaveform = vi.hoisted(() => vi.fn());
const mockTriggerWaveformDecode = vi.hoisted(() => vi.fn());

vi.mock("@/app/features/ui/waveform", () => ({
  clearWaveform: mockClearWaveform,
  triggerWaveformDecode: mockTriggerWaveformDecode,
  syncWaveformPlayhead: vi.fn(),
}));
vi.mock("@/app/features/ui/bpm-display", () => ({ syncBpmDisplay: vi.fn() }));
vi.mock("@/app/features/ui/playback", () => ({ applyPlaybackControlsSize: vi.fn() }));
vi.mock("@/app/features/ui/loop", () => ({ syncLoopBtn: vi.fn() }));
vi.mock("@/app/features/ui/volume", () => ({ syncMuteBtn: vi.fn() }));
vi.mock("@/app/features/ui/toast", () => ({ createToast: vi.fn() }));
vi.mock("@/app/features/fullscreen", () => ({ cleanupFullscreenMode: vi.fn() }));
vi.mock("@/app/features/lifecycle", () => ({ markPlumeInitiatedPlay: vi.fn() }));
vi.mock("@/app/features/observers", () => ({ updateTrackForwardBtnState: vi.fn() }));
vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/shared/logger", () => ({ CPL: { INFO: "info" }, logger: vi.fn() }));
vi.mock("@/shared/browser", () => ({ isSafariBrowser: () => false }));
vi.mock("@/shared/svg", () => ({ setSvgContent: vi.fn() }));
vi.mock("@/shared/presenters", () => ({ presentFormattedTime: () => "0:00" }));
vi.mock("@/svg/icons", () => ({ PLUME_SVG: {} }));
vi.mock("@/app/stores/adapters", () => ({
  getMusicPlayerInstance: () => ({ setVolume: vi.fn(), setPlaybackRate: vi.fn() }),
}));

const fakeGuiState = {
  volumeSlider: { parentElement: null, value: "0", setAttribute: vi.fn() },
  progressSlider: { value: "0", style: { setProperty: vi.fn() }, setAttribute: vi.fn() },
  elapsedDisplay: { textContent: "" },
  durationDisplay: { textContent: "" },
  loopBtns: [],
  speedBtns: [],
  playPauseBtns: [],
};
vi.mock("@/app/stores/GuiImpl", () => ({
  getGuiInstance: () => ({ getState: () => fakeGuiState, dispatch: vi.fn() }),
}));

import { setupStoreSubscriptions } from "@/app/features/store-subscriptions";
import { syncBpmDisplay } from "@/app/features/ui/bpm-display";
import { PLUME_DEFAULTS } from "@/domain/plume";
import { coreActions } from "@/domain/ports/app-core";
import { PLUME_CSS_CLASSES } from "@/infra/elements/plume";
import { FakeAppCore } from "../../fakes/FakeAppCore";

let fakeAppCore = new FakeAppCore();
vi.mock("@/app/stores/AppCoreImpl", () => ({ getAppCoreInstance: () => fakeAppCore }));

const makeCanvas = (hidden = false): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.id = "plume-waveform-canvas";
  if (hidden) canvas.classList.add(PLUME_CSS_CLASSES.featureHidden);
  document.body.appendChild(canvas);
  return canvas;
};

let cleanup: () => void;

beforeEach(() => {
  vi.clearAllMocks();
  fakeAppCore = new FakeAppCore({
    featureFlags: { ...PLUME_DEFAULTS.featureFlags, waveform: false },
  });
});

afterEach(() => {
  cleanup?.();
  document.body.innerHTML = "";
});

describe("trackNumber subscription — waveform gating", () => {
  it("does not decode or clear when waveform flag is off", () => {
    makeCanvas();
    cleanup = setupStoreSubscriptions();

    fakeAppCore.dispatch(coreActions.setTrackNumber("1"));

    expect(mockClearWaveform).not.toHaveBeenCalled();
    expect(mockTriggerWaveformDecode).not.toHaveBeenCalled();
  });

  it("clears and decodes a visible canvas when waveform flag is on", () => {
    fakeAppCore = new FakeAppCore({
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, waveform: true },
    });
    const canvas = makeCanvas();
    cleanup = setupStoreSubscriptions();
    mockClearWaveform.mockClear();
    mockTriggerWaveformDecode.mockClear(); // clear initial kickoff call

    fakeAppCore.dispatch(coreActions.setTrackNumber("1"));

    expect(mockClearWaveform).toHaveBeenCalledWith(canvas);
    expect(mockTriggerWaveformDecode).toHaveBeenCalledWith(canvas);
  });

  it("skips a canvas already hidden when waveform flag is on", () => {
    fakeAppCore = new FakeAppCore({
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, waveform: true },
    });
    makeCanvas(true); // hidden
    cleanup = setupStoreSubscriptions();
    mockClearWaveform.mockClear();
    mockTriggerWaveformDecode.mockClear();

    fakeAppCore.dispatch(coreActions.setTrackNumber("1"));

    expect(mockClearWaveform).not.toHaveBeenCalled();
    expect(mockTriggerWaveformDecode).not.toHaveBeenCalled();
  });

  it("only decodes visible canvases when both a visible and a hidden canvas exist", () => {
    fakeAppCore = new FakeAppCore({
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, waveform: true },
    });
    const visibleCanvas = makeCanvas(false);
    makeCanvas(true); // hidden — should be skipped
    cleanup = setupStoreSubscriptions();
    mockClearWaveform.mockClear();
    mockTriggerWaveformDecode.mockClear();

    fakeAppCore.dispatch(coreActions.setTrackNumber("1"));

    expect(mockTriggerWaveformDecode).toHaveBeenCalledTimes(1);
    expect(mockTriggerWaveformDecode).toHaveBeenCalledWith(visibleCanvas);
  });

  it("always calls syncBpmDisplay regardless of waveform flag", () => {
    makeCanvas();
    cleanup = setupStoreSubscriptions();

    fakeAppCore.dispatch(coreActions.setTrackNumber("1"));

    expect(vi.mocked(syncBpmDisplay)).toHaveBeenCalled();
  });
});
