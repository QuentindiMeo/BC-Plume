// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PLUME_ELEM_SELECTORS } from "@/infra/elements/plume";
import { FakeAppCore } from "../../fakes/FakeAppCore";
import { FakeMusicPlayer } from "../../fakes/FakeMusicPlayer";

const fakeToast = vi.fn();
vi.mock("@/app/features/ui/toast", () => ({ createToast: (...args: unknown[]) => fakeToast(...args) }));

let fakeAppCore = new FakeAppCore();
let fakeMusicPlayer = new FakeMusicPlayer();

vi.mock("@/app/stores/AppCoreImpl", () => ({ getAppCoreInstance: () => fakeAppCore }));
vi.mock("@/app/stores/adapters", () => ({
  getMusicPlayerInstance: () => fakeMusicPlayer,
}));

const mockGetState = vi.fn(() => ({}));
vi.mock("@/app/stores/GuiImpl", () => ({
  getGuiInstance: () => ({
    getState: mockGetState,
  }),
}));

vi.mock("@/app/features/fullscreen", () => ({ cleanupFullscreenMode: vi.fn() }));
vi.mock("@/app/features/observers", () => ({ updateTrackForwardBtnState: vi.fn() }));
vi.mock("@/app/features/ui/loop", () => ({ syncLoopBtn: vi.fn() }));
vi.mock("@/app/features/ui/volume", () => ({ syncMuteBtn: vi.fn() }));
vi.mock("@/infra/elements/plume", () => ({
  PLUME_ELEM_SELECTORS: {
    speedLabel: PLUME_ELEM_SELECTORS.speedLabel,
    speedSlider: PLUME_ELEM_SELECTORS.speedSlider,
  },
}));
vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/shared/logger", () => ({ CPL: {}, logger: vi.fn() }));
vi.mock("@/shared/presenters", () => ({ presentFormattedTime: () => "0:00" }));
vi.mock("@/shared/svg", () => ({ setSvgContent: vi.fn() }));
vi.mock("@/svg/icons", () => ({ PLUME_SVG: {} }));

const makeSpeedWrapper = (): HTMLDivElement => {
  const wrapper = document.createElement("div");
  const btn = document.createElement("button");
  const popover = document.createElement("div");
  popover.className = PLUME_ELEM_SELECTORS.speedPopover.split(".")[1];
  const label = document.createElement("span");
  label.className = PLUME_ELEM_SELECTORS.speedLabel.split(".")[1];
  label.textContent = "1×";
  const slider = document.createElement("input");
  slider.type = "range";
  slider.className = PLUME_ELEM_SELECTORS.speedSlider.split(".")[1];
  slider.min = "0";
  slider.max = "8";
  slider.step = "1";
  slider.value = "3"; // index of 1× in PLAYBACK_SPEED_STEPS
  popover.appendChild(label);
  popover.appendChild(slider);
  wrapper.appendChild(btn);
  wrapper.appendChild(popover);
  return wrapper;
};

const speedLabel = (wrapper: HTMLDivElement) =>
  wrapper.querySelector<HTMLElement>("." + PLUME_ELEM_SELECTORS.speedLabel.split(".")[1]);
const speedSlider = (wrapper: HTMLDivElement) =>
  wrapper.querySelector<HTMLInputElement>("." + PLUME_ELEM_SELECTORS.speedSlider.split(".")[1]);

// Build a minimal plume GUI state with a speed wrapper
const makeGuiState = (speedBtns: HTMLDivElement[]) => ({
  speedBtns,
  loopBtns: [],
  playPauseBtns: [],
  trackFwdBtns: [],
  volumeSlider: { value: "100", setAttribute: vi.fn(), parentElement: null } as unknown as HTMLInputElement,
});

describe("playbackSpeed store subscription", () => {
  let cleanup: () => void;
  let speedWrapper: HTMLDivElement;

  beforeEach(async () => {
    vi.resetModules();
    fakeAppCore = new FakeAppCore();
    fakeMusicPlayer = new FakeMusicPlayer();
    speedWrapper = makeSpeedWrapper();
    mockGetState.mockReturnValue(makeGuiState([speedWrapper]));
    fakeToast.mockReset();

    const { setupStoreSubscriptions } = await import("@/app/features/store-subscriptions");
    cleanup = setupStoreSubscriptions();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("calls setPlaybackRate on the music player when speed changes", () => {
    fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 1.5 as never });
    expect(fakeMusicPlayer.playbackRate).toBe(1.5);
  });

  it("updates the label text when speed changes", () => {
    fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 2 as never });
    expect(speedLabel(speedWrapper)?.textContent).toBe("2×");
  });

  it("updates the slider value when speed changes", () => {
    fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 2 as never });
    expect(speedSlider(speedWrapper)?.value).toBe("6"); // index of 2 in PLAYBACK_SPEED_STEPS
  });

  it("updates all wrappers when multiple exist", () => {
    const wrapper2 = makeSpeedWrapper();
    mockGetState.mockReturnValue(makeGuiState([speedWrapper, wrapper2]));

    fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 0.5 as never });

    expect(speedLabel(speedWrapper)?.textContent).toBe("0.5×");
    expect(speedLabel(wrapper2)?.textContent).toBe("0.5×");
    expect(speedSlider(speedWrapper)?.value).toBe("1"); // index of 0.5
    expect(speedSlider(wrapper2)?.value).toBe("1");
  });

  describe("Safari speed warning toast", () => {
    beforeEach(() => {
      vi.stubGlobal("navigator", { vendor: "Apple Computer, Inc." });
    });

    it("shows the toast when speed drops below 0.5 on Safari", () => {
      fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 0.25 as never });
      expect(fakeToast).toHaveBeenCalledOnce();
    });

    it("shows the toast when speed exceeds 2 on Safari", () => {
      fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 3 as never });
      expect(fakeToast).toHaveBeenCalledOnce();
    });

    it("does not show the toast for a speed within Safari's supported range", () => {
      fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 1.5 as never });
      expect(fakeToast).not.toHaveBeenCalled();
    });

    it("does not show the toast a second time on the same session", () => {
      fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 0.25 as never });
      fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 3 as never });
      expect(fakeToast).toHaveBeenCalledOnce();
    });
  });

  describe("Safari speed warning toast — non-Safari", () => {
    beforeEach(() => {
      vi.stubGlobal("navigator", { vendor: "Google Inc." });
    });

    it("does not show the toast on Chrome even for an out-of-Safari-range speed", () => {
      fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 0.25 as never });
      expect(fakeToast).not.toHaveBeenCalled();
    });
  });
});

describe("speedControl feature flag subscription", () => {
  let cleanup: () => void;
  let speedWrapper: HTMLDivElement;

  beforeEach(async () => {
    vi.resetModules();
    fakeAppCore = new FakeAppCore();
    fakeMusicPlayer = new FakeMusicPlayer();
    speedWrapper = makeSpeedWrapper();
    mockGetState.mockReturnValue(makeGuiState([speedWrapper]));
    fakeToast.mockReset();

    const { setupStoreSubscriptions } = await import("@/app/features/store-subscriptions");
    cleanup = setupStoreSubscriptions();
  });

  afterEach(() => {
    cleanup();
  });

  it("hides the speed wrapper when speedControl flag is disabled", () => {
    const flags = { ...fakeAppCore.getState().featureFlags, speedControl: false };
    fakeAppCore.dispatch({ type: "SET_FEATURE_FLAGS" as never, payload: flags as never });
    expect(speedWrapper.hidden).toBe(true);
  });

  it("shows the speed wrapper when speedControl flag is re-enabled", () => {
    const disabledFlags = { ...fakeAppCore.getState().featureFlags, speedControl: false };
    fakeAppCore.dispatch({ type: "SET_FEATURE_FLAGS" as never, payload: disabledFlags as never });

    const enabledFlags = { ...fakeAppCore.getState().featureFlags, speedControl: true };
    fakeAppCore.dispatch({ type: "SET_FEATURE_FLAGS" as never, payload: enabledFlags as never });
    expect(speedWrapper.hidden).toBe(false);
  });

  it("resets playback speed to 1× when speedControl is disabled", () => {
    fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 2 as never });

    const flags = { ...fakeAppCore.getState().featureFlags, speedControl: false };
    fakeAppCore.dispatch({ type: "SET_FEATURE_FLAGS" as never, payload: flags as never });

    expect(fakeAppCore.getState().playbackSpeed).toBe(1);
  });
});
