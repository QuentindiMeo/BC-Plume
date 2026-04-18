// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
vi.mock("@/infra/elements/plume", () => ({ PLUME_ELEM_SELECTORS: {} }));
vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/shared/logger", () => ({ CPL: {}, logger: vi.fn() }));
vi.mock("@/shared/presenters", () => ({ presentFormattedTime: () => "0:00" }));
vi.mock("@/shared/svg", () => ({ setSvgContent: vi.fn() }));
vi.mock("@/svg/icons", () => ({ PLUME_SVG: {} }));

const makeSpeedBtn = (): HTMLButtonElement => {
  const btn = document.createElement("button");
  btn.textContent = "1×";
  return btn;
};

// Build a minimal plume GUI state with a speed button
const makeGuiState = (speedBtns: HTMLButtonElement[]) => ({
  speedBtns,
  loopBtns: [],
  playPauseBtns: [],
  trackFwdBtns: [],
  volumeSlider: { value: "100", setAttribute: vi.fn(), parentElement: null } as unknown as HTMLInputElement,
});

describe("playbackSpeed store subscription", () => {
  let cleanup: () => void;
  let speedBtn: HTMLButtonElement;

  beforeEach(async () => {
    vi.resetModules();
    fakeAppCore = new FakeAppCore();
    fakeMusicPlayer = new FakeMusicPlayer();
    speedBtn = makeSpeedBtn();
    mockGetState.mockReturnValue(makeGuiState([speedBtn]));
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

  it("updates speed button text when speed changes", () => {
    fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 2 as never });
    expect(speedBtn.textContent).toBe("2×");
  });

  it("updates all speed buttons when multiple exist", () => {
    const btn2 = makeSpeedBtn();
    mockGetState.mockReturnValue(makeGuiState([speedBtn, btn2]));

    fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 0.5 as never });

    expect(speedBtn.textContent).toBe("0.5×");
    expect(btn2.textContent).toBe("0.5×");
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
  let speedBtn: HTMLButtonElement;

  beforeEach(async () => {
    vi.resetModules();
    fakeAppCore = new FakeAppCore();
    fakeMusicPlayer = new FakeMusicPlayer();
    speedBtn = makeSpeedBtn();
    mockGetState.mockReturnValue(makeGuiState([speedBtn]));
    fakeToast.mockReset();

    const { setupStoreSubscriptions } = await import("@/app/features/store-subscriptions");
    cleanup = setupStoreSubscriptions();
  });

  afterEach(() => {
    cleanup();
  });

  it("hides speed buttons when speedControl flag is disabled", () => {
    const flags = { ...fakeAppCore.getState().featureFlags, speedControl: false };
    fakeAppCore.dispatch({ type: "SET_FEATURE_FLAGS" as never, payload: flags as never });
    expect(speedBtn.hidden).toBe(true);
  });

  it("shows speed buttons when speedControl flag is re-enabled", () => {
    const disabledFlags = { ...fakeAppCore.getState().featureFlags, speedControl: false };
    fakeAppCore.dispatch({ type: "SET_FEATURE_FLAGS" as never, payload: disabledFlags as never });

    const enabledFlags = { ...fakeAppCore.getState().featureFlags, speedControl: true };
    fakeAppCore.dispatch({ type: "SET_FEATURE_FLAGS" as never, payload: enabledFlags as never });
    expect(speedBtn.hidden).toBe(false);
  });

  it("resets playback speed to 1× when speedControl is disabled", () => {
    fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 2 as never });

    const flags = { ...fakeAppCore.getState().featureFlags, speedControl: false };
    fakeAppCore.dispatch({ type: "SET_FEATURE_FLAGS" as never, payload: flags as never });

    expect(fakeAppCore.getState().playbackSpeed).toBe(1);
  });
});
