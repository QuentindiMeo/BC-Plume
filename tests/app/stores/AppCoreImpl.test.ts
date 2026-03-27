import { LOOP_MODE, LOOP_MODE_CYCLE, PLUME_DEFAULTS, SEEK_JUMP_DURATION_MAX, SEEK_JUMP_DURATION_MIN, TIME_DISPLAY_METHOD, TRACK_RESTART_THRESHOLD_MAX, VOLUME_HOTKEY_STEP_MAX, VOLUME_HOTKEY_STEP_MIN } from "@/src/domain/plume";
import { coreActions, type IAppCore } from "@/src/domain/ports/app-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/app/stores/BrowserImpl", () => ({
  getBrowserInstance: vi.fn(() => ({
    dispatch: vi.fn(),
    getState: vi.fn(() => ({
      cache: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
      },
    })),
  })),
}));

vi.mock("@/src/app/stores/adapters", () => ({
  getMusicPlayerInstance: vi.fn(() => ({
    setLoop: vi.fn(),
    getCurrentTime: vi.fn(() => 0),
    getDuration: vi.fn(() => 0),
    seekAndPreservePause: vi.fn(),
    seekTo: vi.fn(),
    isPaused: vi.fn(() => false),
    getVolume: vi.fn(() => 1),
    play: vi.fn(),
    pause: vi.fn(),
    setVolume: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

vi.mock("@/src/infra/node", () => ({
  PROCESS_ENV: { PRODUCTION: "production", DEVELOPMENT: "development", TESTING: "testing" },
  meta: { env: "development", version: "0.0.0" },
}));

// Import after mocks are hoisted
const { createAppCoreInstance } = await import("@/src/app/stores/AppCoreImpl");

describe("AppCoreImpl reducer", () => {
  let appCore: IAppCore;

  beforeEach(() => {
    vi.useFakeTimers();
    appCore = createAppCoreInstance();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Basic transient state updates ───────────────────────────────────────

  describe("SET_PAGE_TYPE", () => {
    it("updates pageType", () => {
      appCore.dispatch(coreActions.setPageType("album"));
      expect(appCore.getState().pageType).toBe("album");
    });

    it("accepts null", () => {
      appCore.dispatch(coreActions.setPageType("album"));
      appCore.dispatch(coreActions.setPageType(null));
      expect(appCore.getState().pageType).toBeNull();
    });
  });

  describe("SET_TRACK_TITLE", () => {
    it("updates trackTitle", () => {
      appCore.dispatch(coreActions.setTrackTitle("Test Track"));
      expect(appCore.getState().trackTitle).toBe("Test Track");
    });

    it("accepts null", () => {
      appCore.dispatch(coreActions.setTrackTitle("Test Track"));
      appCore.dispatch(coreActions.setTrackTitle(null));
      expect(appCore.getState().trackTitle).toBeNull();
    });
  });

  describe("SET_TRACK_NUMBER", () => {
    it("updates trackNumber", () => {
      appCore.dispatch(coreActions.setTrackNumber("3/10"));
      expect(appCore.getState().trackNumber).toBe("3/10");
    });
  });

  describe("SET_CURRENT_TIME", () => {
    it("updates currentTime", () => {
      appCore.dispatch(coreActions.setCurrentTime(42));
      expect(appCore.getState().currentTime).toBe(42);
    });
  });

  describe("SET_DURATION", () => {
    it("updates duration", () => {
      appCore.dispatch(coreActions.setDuration(240));
      expect(appCore.getState().duration).toBe(240);
    });
  });

  describe("SET_IS_PLAYING", () => {
    it("sets isPlaying to true", () => {
      appCore.dispatch(coreActions.setIsPlaying(true));
      expect(appCore.getState().isPlaying).toBe(true);
    });

    it("sets isPlaying to false", () => {
      appCore.dispatch(coreActions.setIsPlaying(true));
      appCore.dispatch(coreActions.setIsPlaying(false));
      expect(appCore.getState().isPlaying).toBe(false);
    });
  });

  describe("SET_IS_MUTED", () => {
    it("updates isMuted", () => {
      appCore.dispatch(coreActions.setIsMuted(true));
      expect(appCore.getState().isMuted).toBe(true);
    });
  });

  describe("SET_IS_FULLSCREEN", () => {
    it("updates isFullscreen", () => {
      appCore.dispatch(coreActions.setIsFullscreen(true));
      expect(appCore.getState().isFullscreen).toBe(true);
    });
  });

  describe("SET_DURATION_DISPLAY_METHOD", () => {
    it("updates durationDisplayMethod to REMAINING", () => {
      appCore.dispatch(coreActions.setDurationDisplayMethod(TIME_DISPLAY_METHOD.REMAINING));
      expect(appCore.getState().durationDisplayMethod).toBe(TIME_DISPLAY_METHOD.REMAINING);
    });

    it("updates durationDisplayMethod back to DURATION", () => {
      appCore.dispatch(coreActions.setDurationDisplayMethod(TIME_DISPLAY_METHOD.REMAINING));
      appCore.dispatch(coreActions.setDurationDisplayMethod(TIME_DISPLAY_METHOD.DURATION));
      expect(appCore.getState().durationDisplayMethod).toBe(TIME_DISPLAY_METHOD.DURATION);
    });
  });

  // ─── SET_VOLUME ───────────────────────────────────────────────────────────

  describe("SET_VOLUME", () => {
    it("accepts a valid mid-range value", () => {
      appCore.dispatch(coreActions.setVolume(0.75));
      expect(appCore.getState().volume).toBe(0.75);
    });

    it("accepts 0 (lower boundary)", () => {
      appCore.dispatch(coreActions.setVolume(0));
      expect(appCore.getState().volume).toBe(0);
    });

    it("accepts 1 (upper boundary)", () => {
      appCore.dispatch(coreActions.setVolume(1));
      expect(appCore.getState().volume).toBe(1);
    });

    it("rejects values below 0, leaving volume unchanged", () => {
      const before = appCore.getState().volume;
      appCore.dispatch(coreActions.setVolume(-0.1));
      expect(appCore.getState().volume).toBe(before);
    });

    it("rejects values above 1, leaving volume unchanged", () => {
      const before = appCore.getState().volume;
      appCore.dispatch(coreActions.setVolume(1.1));
      expect(appCore.getState().volume).toBe(before);
    });
  });

  // ─── TOGGLE_MUTE ─────────────────────────────────────────────────────────

  describe("TOGGLE_MUTE", () => {
    it("muting saves current volume, sets volume to 0, and sets isMuted", () => {
      appCore.dispatch(coreActions.setVolume(0.8));
      appCore.dispatch(coreActions.toggleMute());

      const state = appCore.getState();
      expect(state.isMuted).toBe(true);
      expect(state.volume).toBe(0);
      expect(state.volumeBeforeMute).toBe(0.8);
    });

    it("unmuting restores the saved volume and clears isMuted", () => {
      appCore.dispatch(coreActions.setVolume(0.6));
      appCore.dispatch(coreActions.toggleMute()); // mute
      appCore.dispatch(coreActions.toggleMute()); // unmute

      const state = appCore.getState();
      expect(state.isMuted).toBe(false);
      expect(state.volume).toBe(0.6);
    });

    it("unmuting when volumeBeforeMute is 0 falls back to savedVolume default", () => {
      // Mute while volume is 0 — this stores 0 into volumeBeforeMute
      appCore.dispatch(coreActions.setVolume(0));
      appCore.dispatch(coreActions.toggleMute()); // mute: saves volumeBeforeMute = 0
      appCore.dispatch(coreActions.toggleMute()); // unmute: volumeBeforeMute = 0 → fallback

      const state = appCore.getState();
      expect(state.isMuted).toBe(false);
      expect(state.volume).toBe(PLUME_DEFAULTS.savedVolume);
    });
  });

  // ─── SET_LOOP_MODE ───────────────────────────────────────────────────────

  describe("SET_LOOP_MODE", () => {
    it("sets loopMode directly", () => {
      appCore.dispatch(coreActions.setLoopMode(LOOP_MODE.TRACK));
      expect(appCore.getState().loopMode).toBe(LOOP_MODE.TRACK);
    });
  });

  // ─── CYCLE_LOOP_MODE ─────────────────────────────────────────────────────

  describe("CYCLE_LOOP_MODE", () => {
    it("cycles through all modes on a non-track page", () => {
      appCore.dispatch(coreActions.setPageType("album"));
      // Starts at NONE; cycle follows LOOP_MODE_CYCLE order
      const cycleExpected = [...LOOP_MODE_CYCLE.slice(1), LOOP_MODE_CYCLE[0]];
      for (const expected of cycleExpected) {
        appCore.dispatch(coreActions.cycleLoopMode());
        expect(appCore.getState().loopMode).toBe(expected);
      }
    });

    it("skips COLLECTION on a track page when NONE → next", () => {
      appCore.dispatch(coreActions.setPageType("track"));
      // NONE is at index 0; next in cycle is COLLECTION — should be skipped to TRACK
      appCore.dispatch(coreActions.cycleLoopMode());
      expect(appCore.getState().loopMode).toBe(LOOP_MODE.TRACK);
    });

    it("wraps from TRACK back to NONE on a track page", () => {
      appCore.dispatch(coreActions.setPageType("track"));
      appCore.dispatch(coreActions.setLoopMode(LOOP_MODE.NONE));
      appCore.dispatch(coreActions.cycleLoopMode()); // NONE → TRACK (skipped COLLECTION)
      appCore.dispatch(coreActions.cycleLoopMode()); // TRACK (idx 2) → NONE (wraps)
      expect(appCore.getState().loopMode).toBe(LOOP_MODE.NONE);
    });

    it("wraps back to NONE after TRACK on a non-track page", () => {
      appCore.dispatch(coreActions.setPageType("album"));
      appCore.dispatch(coreActions.setLoopMode(LOOP_MODE.TRACK));
      appCore.dispatch(coreActions.cycleLoopMode());
      expect(appCore.getState().loopMode).toBe(LOOP_MODE.NONE);
    });
  });

  // ─── Bounded integer settings ─────────────────────────────────────────────

  describe("SET_SEEK_JUMP_DURATION", () => {
    it("accepts a valid value", () => {
      appCore.dispatch(coreActions.setSeekJumpDuration(30));
      expect(appCore.getState().seekJumpDuration).toBe(30);
    });

    it("accepts the minimum boundary", () => {
      appCore.dispatch(coreActions.setSeekJumpDuration(SEEK_JUMP_DURATION_MIN));
      expect(appCore.getState().seekJumpDuration).toBe(SEEK_JUMP_DURATION_MIN);
    });

    it("accepts the maximum boundary", () => {
      appCore.dispatch(coreActions.setSeekJumpDuration(SEEK_JUMP_DURATION_MAX));
      expect(appCore.getState().seekJumpDuration).toBe(SEEK_JUMP_DURATION_MAX);
    });

    it("falls back to default when value is below minimum", () => {
      appCore.dispatch(coreActions.setSeekJumpDuration(0));
      expect(appCore.getState().seekJumpDuration).toBe(PLUME_DEFAULTS.seekJumpDuration);
    });

    it("falls back to default when value is above maximum", () => {
      appCore.dispatch(coreActions.setSeekJumpDuration(SEEK_JUMP_DURATION_MAX + 1));
      expect(appCore.getState().seekJumpDuration).toBe(PLUME_DEFAULTS.seekJumpDuration);
    });

    it("falls back to default for a non-integer", () => {
      appCore.dispatch(coreActions.setSeekJumpDuration(10.5));
      expect(appCore.getState().seekJumpDuration).toBe(PLUME_DEFAULTS.seekJumpDuration);
    });
  });

  describe("SET_VOLUME_HOTKEY_STEP", () => {
    it("accepts a valid value", () => {
      appCore.dispatch(coreActions.setVolumeHotkeyStep(10));
      expect(appCore.getState().volumeHotkeyStep).toBe(10);
    });

    it("accepts the minimum boundary", () => {
      appCore.dispatch(coreActions.setVolumeHotkeyStep(VOLUME_HOTKEY_STEP_MIN));
      expect(appCore.getState().volumeHotkeyStep).toBe(VOLUME_HOTKEY_STEP_MIN);
    });

    it("accepts the maximum boundary", () => {
      appCore.dispatch(coreActions.setVolumeHotkeyStep(VOLUME_HOTKEY_STEP_MAX));
      expect(appCore.getState().volumeHotkeyStep).toBe(VOLUME_HOTKEY_STEP_MAX);
    });

    it("falls back to default when value is below minimum", () => {
      appCore.dispatch(coreActions.setVolumeHotkeyStep(0));
      expect(appCore.getState().volumeHotkeyStep).toBe(PLUME_DEFAULTS.volumeHotkeyStep);
    });

    it("falls back to default when value exceeds maximum", () => {
      appCore.dispatch(coreActions.setVolumeHotkeyStep(VOLUME_HOTKEY_STEP_MAX + 1));
      expect(appCore.getState().volumeHotkeyStep).toBe(PLUME_DEFAULTS.volumeHotkeyStep);
    });
  });

  describe("SET_TRACK_RESTART_THRESHOLD", () => {
    it("accepts a valid value", () => {
      appCore.dispatch(coreActions.setTrackRestartThreshold(3));
      expect(appCore.getState().trackRestartThreshold).toBe(3);
    });

    it("accepts 0 (lower bound is 0, not 1)", () => {
      appCore.dispatch(coreActions.setTrackRestartThreshold(0));
      expect(appCore.getState().trackRestartThreshold).toBe(0);
    });

    it("accepts the maximum boundary", () => {
      appCore.dispatch(coreActions.setTrackRestartThreshold(TRACK_RESTART_THRESHOLD_MAX));
      expect(appCore.getState().trackRestartThreshold).toBe(TRACK_RESTART_THRESHOLD_MAX);
    });

    it("falls back to default when value is negative", () => {
      appCore.dispatch(coreActions.setTrackRestartThreshold(-1));
      expect(appCore.getState().trackRestartThreshold).toBe(PLUME_DEFAULTS.trackRestartThreshold);
    });

    it("falls back to default when value exceeds maximum", () => {
      appCore.dispatch(coreActions.setTrackRestartThreshold(TRACK_RESTART_THRESHOLD_MAX + 1));
      expect(appCore.getState().trackRestartThreshold).toBe(PLUME_DEFAULTS.trackRestartThreshold);
    });

    it("falls back to default for a float", () => {
      appCore.dispatch(coreActions.setTrackRestartThreshold(2.5));
      expect(appCore.getState().trackRestartThreshold).toBe(PLUME_DEFAULTS.trackRestartThreshold);
    });
  });

  // ─── Subscriptions ───────────────────────────────────────────────────────

  describe("subscribe", () => {
    it("calls listener when subscribed key changes", () => {
      const listener = vi.fn();
      appCore.subscribe("currentTime", listener);
      appCore.dispatch(coreActions.setCurrentTime(99));
      expect(listener).toHaveBeenCalledWith(99, 0);
    });

    it("does not call listener when a different key changes", () => {
      const listener = vi.fn();
      appCore.subscribe("currentTime", listener);
      appCore.dispatch(coreActions.setIsPlaying(true));
      expect(listener).not.toHaveBeenCalled();
    });

    it("does not call listener after unsubscribing", () => {
      const listener = vi.fn();
      const unsubscribe = appCore.subscribe("currentTime", listener);
      unsubscribe();
      appCore.dispatch(coreActions.setCurrentTime(50));
      expect(listener).not.toHaveBeenCalled();
    });

    it("does not call listener when value is unchanged", () => {
      appCore.dispatch(coreActions.setCurrentTime(10));
      const listener = vi.fn();
      appCore.subscribe("currentTime", listener);
      appCore.dispatch(coreActions.setCurrentTime(10)); // same value
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("subscribeAll", () => {
    it("calls listener with full state on any change", () => {
      const listener = vi.fn();
      appCore.subscribeAll(listener);
      appCore.dispatch(coreActions.setIsPlaying(true));
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ isPlaying: true }));
    });

    it("does not call listener after unsubscribing", () => {
      const listener = vi.fn();
      const unsubscribe = appCore.subscribeAll(listener);
      unsubscribe();
      appCore.dispatch(coreActions.setIsPlaying(true));
      expect(listener).not.toHaveBeenCalled();
    });
  });

  // ─── Thunk dispatch ──────────────────────────────────────────────────────

  describe("dispatch thunk", () => {
    it("invokes thunk with dispatch and getState", () => {
      const thunk = vi.fn((_dispatch: unknown, getState: () => unknown) => {
        expect(typeof getState()).toBe("object");
      });
      appCore.dispatch(thunk as never);
      expect(thunk).toHaveBeenCalled();
    });
  });

  // ─── Computed ────────────────────────────────────────────────────────────

  describe("computed", () => {
    it("formattedElapsed returns a time string", () => {
      appCore.dispatch(coreActions.setCurrentTime(65));
      expect(appCore.computed.formattedElapsed()).toMatch(/^\d+:\d{2}$/);
    });

    it("formattedDuration returns a time string", () => {
      appCore.dispatch(coreActions.setDuration(120));
      expect(appCore.computed.formattedDuration()).toMatch(/^-?\d+:\d{2}$/);
    });

    it("progressPercentage returns 0 when duration is 0", () => {
      expect(appCore.computed.progressPercentage()).toBe(0);
    });

    it("progressPercentage returns correct percentage", () => {
      appCore.dispatch(coreActions.setDuration(200));
      appCore.dispatch(coreActions.setCurrentTime(50));
      expect(appCore.computed.progressPercentage()).toBe(25);
    });
  });
});
