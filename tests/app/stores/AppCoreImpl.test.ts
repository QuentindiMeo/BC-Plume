import { getBrowserInstance } from "@/app/stores/BrowserImpl";
import { PLUME_CACHE_KEYS } from "@/domain/browser";
import {
  LOOP_MODE,
  LOOP_MODE_CYCLE,
  PLAYBACK_SPEED_DEFAULT,
  PLAYBACK_SPEED_STEPS,
  PLUME_DEFAULTS,
  SEEK_JUMP_DURATION_MAX,
  SEEK_JUMP_DURATION_MIN,
  TIME_DISPLAY_METHOD,
  TRACK_RESTART_THRESHOLD_MAX,
  VOLUME_HOTKEY_STEP_MAX,
  VOLUME_HOTKEY_STEP_MIN,
} from "@/domain/plume";
import { coreActions, type IAppCore } from "@/domain/ports/app-core";
import { BROWSER_ACTIONS } from "@/domain/ports/browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/stores/BrowserImpl", () => ({
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

vi.mock("@/app/stores/adapters", () => ({
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

vi.mock("@/infra/node", () => ({
  PROCESS_ENV: { PRODUCTION: "production", DEVELOPMENT: "development", TESTING: "testing" },
  meta: { env: "development", version: "0.0.0" },
}));

// Import after mocks are hoisted
const { createAppCoreInstance } = await import("@/app/stores/AppCoreImpl");

describe("AppCoreImpl reducer", () => {
  let appCore: IAppCore;

  beforeEach(() => {
    vi.useFakeTimers();
    appCore = createAppCoreInstance();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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

  describe("SET_LOOP_MODE", () => {
    it("sets loopMode directly", () => {
      appCore.dispatch(coreActions.setLoopMode(LOOP_MODE.TRACK));
      expect(appCore.getState().loopMode).toBe(LOOP_MODE.TRACK);
    });
  });

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

  describe("SET_PLAYBACK_SPEED", () => {
    it("starts at the default speed", () => {
      expect(appCore.getState().playbackSpeed).toBe(PLAYBACK_SPEED_DEFAULT);
    });

    it.each(PLAYBACK_SPEED_STEPS)("accepts predefined step %s×", (speed: number) => {
      appCore.dispatch(coreActions.setPlaybackSpeed(speed));
      expect(appCore.getState().playbackSpeed).toBe(speed);
    });

    it("accepts a custom in-range float not in PLAYBACK_SPEED_STEPS", () => {
      appCore.dispatch(coreActions.setPlaybackSpeed(1.3));
      expect(appCore.getState().playbackSpeed).toBe(1.3);
    });

    it("rounds the stored value to 2 decimal places", () => {
      appCore.dispatch(coreActions.setPlaybackSpeed(1.555));
      expect(appCore.getState().playbackSpeed).toBe(1.56);
    });

    it("accepts the minimum bound (0.25)", () => {
      appCore.dispatch(coreActions.setPlaybackSpeed(0.25));
      expect(appCore.getState().playbackSpeed).toBe(0.25);
    });

    it("accepts the maximum bound (3)", () => {
      appCore.dispatch(coreActions.setPlaybackSpeed(3));
      expect(appCore.getState().playbackSpeed).toBe(3);
    });

    it("resets to default for a negative value", () => {
      appCore.dispatch(coreActions.setPlaybackSpeed(-1));
      expect(appCore.getState().playbackSpeed).toBe(PLAYBACK_SPEED_DEFAULT);
    });

    it("resets to default for zero", () => {
      appCore.dispatch(coreActions.setPlaybackSpeed(0));
      expect(appCore.getState().playbackSpeed).toBe(PLAYBACK_SPEED_DEFAULT);
    });

    it("resets to default for a value above the maximum", () => {
      appCore.dispatch(coreActions.setPlaybackSpeed(6));
      expect(appCore.getState().playbackSpeed).toBe(PLAYBACK_SPEED_DEFAULT);
    });
  });

  describe("SET_FEATURE_FLAGS", () => {
    it("updates featureFlags", () => {
      const flags = { ...PLUME_DEFAULTS.featureFlags, fullscreen: false };
      appCore.dispatch(coreActions.setFeatureFlags(flags));
      expect(appCore.getState().featureFlags).toEqual(flags);
    });

    it("merges with defaults so new flags get their default value", () => {
      // Dispatch a partial object (simulating a stored value missing a key)
      appCore.dispatch(coreActions.setFeatureFlags({ loopModes: false } as any));
      const result = appCore.getState().featureFlags;
      expect(result.loopModes).toBe(false);
      expect(result.goToTrack).toBe(true);
      expect(result.fullscreen).toBe(true);
      expect(result.runtime).toBe(true);
    });

    it("starts with all flags enabled by default", () => {
      expect(appCore.getState().featureFlags).toEqual(PLUME_DEFAULTS.featureFlags);
    });
  });

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

  describe("dispatch thunk", () => {
    it("invokes thunk with dispatch and getState", () => {
      const thunk = vi.fn((_dispatch: unknown, getState: () => unknown) => {
        expect(typeof getState()).toBe("object");
      });
      appCore.dispatch(thunk as never);
      expect(thunk).toHaveBeenCalled();
    });
  });

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

  describe("SET_TRACK_BPM_LOADING", () => {
    it("sets a track to loading state", () => {
      appCore.dispatch(coreActions.setTrackBpmLoading("/track/test"));
      expect(appCore.getState().trackBpms["/track/test"]).toEqual({
        bpm: null,
        loading: true,
        error: false,
      });
    });

    it("preserves existing bpm when transitioning to loading", () => {
      appCore.dispatch(coreActions.setTrackBpmSuccess("/track/test", 128));
      appCore.dispatch(coreActions.setTrackBpmLoading("/track/test"));
      expect(appCore.getState().trackBpms["/track/test"]).toEqual({
        bpm: 128,
        loading: true,
        error: false,
      });
    });

    it("does not affect other tracks", () => {
      appCore.dispatch(coreActions.setTrackBpmSuccess("/track/a", 120));
      appCore.dispatch(coreActions.setTrackBpmLoading("/track/b"));
      expect(appCore.getState().trackBpms["/track/a"]).toEqual({
        bpm: 120,
        loading: false,
        error: false,
      });
    });
  });

  describe("SET_TRACK_BPM_SUCCESS", () => {
    it("sets a track bpm", () => {
      appCore.dispatch(coreActions.setTrackBpmSuccess("/track/test", 140));
      expect(appCore.getState().trackBpms["/track/test"]).toEqual({
        bpm: 140,
        loading: false,
        error: false,
      });
    });

    it("overwrites a loading state", () => {
      appCore.dispatch(coreActions.setTrackBpmLoading("/track/test"));
      appCore.dispatch(coreActions.setTrackBpmSuccess("/track/test", 95.5));
      const entry = appCore.getState().trackBpms["/track/test"];
      expect(entry.bpm).toBe(95.5);
      expect(entry.loading).toBe(false);
    });
  });

  describe("SET_TRACK_BPM_ERROR", () => {
    it("sets a track to error state", () => {
      appCore.dispatch(coreActions.setTrackBpmError("/track/test"));
      expect(appCore.getState().trackBpms["/track/test"]).toEqual({
        bpm: null,
        loading: false,
        error: true,
      });
    });

    it("preserves existing bpm on error", () => {
      appCore.dispatch(coreActions.setTrackBpmSuccess("/track/test", 128));
      appCore.dispatch(coreActions.setTrackBpmError("/track/test"));
      expect(appCore.getState().trackBpms["/track/test"]).toEqual({
        bpm: 128,
        loading: false,
        error: true,
      });
    });
  });

  describe("CLEAR_TRACK_BPMS", () => {
    it("clears all track bpms", () => {
      appCore.dispatch(coreActions.setTrackBpmSuccess("/track/a", 120));
      appCore.dispatch(coreActions.setTrackBpmSuccess("/track/b", 140));
      appCore.dispatch(coreActions.clearTrackBpms());
      expect(appCore.getState().trackBpms).toEqual({});
    });
  });
});

describe("AppCoreImpl — playbackSpeed persist/load integration", () => {
  const seedStorage = (data: Record<string, unknown>) => {
    vi.mocked(getBrowserInstance).mockReturnValue({
      dispatch: vi.fn(),
      getState: vi.fn(() => ({
        cache: {
          get: vi.fn().mockResolvedValue(data),
          set: vi.fn().mockResolvedValue(undefined),
        },
      })),
    } as unknown as ReturnType<typeof getBrowserInstance>);
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Restore the default empty-storage mock for other tests
    vi.mocked(getBrowserInstance).mockReturnValue({
      dispatch: vi.fn(),
      getState: vi.fn(() => ({
        cache: {
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn().mockResolvedValue(undefined),
        },
      })),
    } as unknown as ReturnType<typeof getBrowserInstance>);
  });

  it("loads a predefined step persisted speed on startup", async () => {
    seedStorage({ [PLUME_CACHE_KEYS.PLAYBACK_SPEED]: 1.5 });
    const appCore = createAppCoreInstance();
    await appCore.loadPersistedState();
    expect(appCore.getState().playbackSpeed).toBe(1.5);
  });

  it("loads a custom in-range float persisted speed on startup", async () => {
    seedStorage({ [PLUME_CACHE_KEYS.PLAYBACK_SPEED]: 1.3 });
    const appCore = createAppCoreInstance();
    await appCore.loadPersistedState();
    expect(appCore.getState().playbackSpeed).toBe(1.3);
  });

  it("falls back to default when the persisted value is out of the valid range", async () => {
    seedStorage({ [PLUME_CACHE_KEYS.PLAYBACK_SPEED]: 99 });
    const appCore = createAppCoreInstance();
    await appCore.loadPersistedState();
    expect(appCore.getState().playbackSpeed).toBe(PLAYBACK_SPEED_DEFAULT);
  });

  it("starts at default when no speed was persisted", async () => {
    seedStorage({});
    const appCore = createAppCoreInstance();
    await appCore.loadPersistedState();
    expect(appCore.getState().playbackSpeed).toBe(PLAYBACK_SPEED_DEFAULT);
  });

  it("persists the speed after dispatch", async () => {
    const dispatchMock = vi.fn();
    vi.mocked(getBrowserInstance).mockReturnValue({
      dispatch: dispatchMock,
      getState: vi.fn(() => ({
        cache: {
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn().mockResolvedValue(undefined),
        },
      })),
    } as unknown as ReturnType<typeof getBrowserInstance>);

    const appCore = createAppCoreInstance();
    await appCore.loadPersistedState();

    appCore.dispatch(coreActions.setPlaybackSpeed(2));
    await vi.runAllTimersAsync(); // flush 200ms PERSISTENCE_DELAY_MS debounce

    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: BROWSER_ACTIONS.SET_CACHE_VALUES,
        payload: expect.objectContaining({
          keys: expect.arrayContaining([PLUME_CACHE_KEYS.PLAYBACK_SPEED]),
          values: expect.arrayContaining([2]),
        }),
      })
    );
  });
});
