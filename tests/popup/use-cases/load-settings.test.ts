import { beforeEach, describe, expect, it, vi } from "vitest";

import { PLUME_CACHE_KEYS } from "@/domain/browser";
import { DEFAULT_HOTKEYS, HotkeyAction, KeyBinding } from "@/domain/hotkeys";
import { FeatureFlags, PLUME_DEFAULTS, PLUME_SUPPORTED_LANGUAGES, PlumeLanguage } from "@/domain/plume";
import { loadFeatureFlags } from "@/popup/use-cases/loadFeatureFlags";
import { loadForcedLanguage } from "@/popup/use-cases/loadForcedLanguage";
import { loadHotkeys } from "@/popup/use-cases/loadHotkeys";
import { loadSeekJumpDuration } from "@/popup/use-cases/loadSeekJumpDuration";
import { loadTrackRestartThreshold } from "@/popup/use-cases/loadTrackRestartThreshold";
import { loadVolumeHotkeyStep } from "@/popup/use-cases/loadVolumeHotkeyStep";
import { inferBrowserApi } from "@/shared/browser";
import { FakeBrowserLocalStorage } from "../../fakes/FakeBrowserLocalStorage";

vi.mock("@/shared/browser", () => ({ inferBrowserApi: vi.fn() }));

let fakeStorage: FakeBrowserLocalStorage;

beforeEach(() => {
  fakeStorage = new FakeBrowserLocalStorage();
  vi.mocked(inferBrowserApi).mockReturnValue({
    storage: { local: fakeStorage },
  } as unknown as ReturnType<typeof inferBrowserApi>);
});

describe("loadSeekJumpDuration", () => {
  it("returns the stored value when valid", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.SEEK_JUMP_DURATION] = 10;
    expect(await loadSeekJumpDuration()).toBe(10);
  });

  it("returns undefined when key is absent", async () => {
    expect(await loadSeekJumpDuration()).toBeUndefined();
  });

  it("returns undefined when value is below MIN (0 < 1)", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.SEEK_JUMP_DURATION] = 0;
    expect(await loadSeekJumpDuration()).toBeUndefined();
  });

  it("returns undefined when value exceeds MAX (301 > 300)", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.SEEK_JUMP_DURATION] = 301;
    expect(await loadSeekJumpDuration()).toBeUndefined();
  });

  it("returns undefined for a float", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.SEEK_JUMP_DURATION] = 10.5;
    expect(await loadSeekJumpDuration()).toBeUndefined();
  });

  it("accepts MIN boundary (1)", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.SEEK_JUMP_DURATION] = 1;
    expect(await loadSeekJumpDuration()).toBe(1);
  });

  it("accepts MAX boundary (300)", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.SEEK_JUMP_DURATION] = 300;
    expect(await loadSeekJumpDuration()).toBe(300);
  });
});

describe("loadVolumeHotkeyStep", () => {
  it("returns the stored value when valid", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP] = 5;
    expect(await loadVolumeHotkeyStep()).toBe(5);
  });

  it("returns undefined when key is absent", async () => {
    expect(await loadVolumeHotkeyStep()).toBeUndefined();
  });

  it("returns undefined when value is below MIN (0 < 1)", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP] = 0;
    expect(await loadVolumeHotkeyStep()).toBeUndefined();
  });

  it("returns undefined when value exceeds MAX (21 > 20)", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP] = 21;
    expect(await loadVolumeHotkeyStep()).toBeUndefined();
  });

  it("returns undefined for a float", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP] = 2.5;
    expect(await loadVolumeHotkeyStep()).toBeUndefined();
  });

  it("accepts MIN boundary (1)", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP] = 1;
    expect(await loadVolumeHotkeyStep()).toBe(1);
  });

  it("accepts MAX boundary (20)", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP] = 20;
    expect(await loadVolumeHotkeyStep()).toBe(20);
  });
});

describe("loadTrackRestartThreshold", () => {
  it("returns the stored value when valid", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD] = 5;
    expect(await loadTrackRestartThreshold()).toBe(5);
  });

  it("returns undefined when key is absent", async () => {
    expect(await loadTrackRestartThreshold()).toBeUndefined();
  });

  it("accepts 0 (lower bound is 0, not 1)", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD] = 0;
    expect(await loadTrackRestartThreshold()).toBe(0);
  });

  it("accepts MAX boundary (10)", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD] = 10;
    expect(await loadTrackRestartThreshold()).toBe(10);
  });

  it("returns undefined when value exceeds MAX (11 > 10)", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD] = 11;
    expect(await loadTrackRestartThreshold()).toBeUndefined();
  });

  it("returns undefined for a float", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD] = 1.5;
    expect(await loadTrackRestartThreshold()).toBeUndefined();
  });
});

describe("loadForcedLanguage", () => {
  it("returns undefined when key is absent", async () => {
    expect(await loadForcedLanguage()).toBeUndefined();
  });

  it.each(PLUME_SUPPORTED_LANGUAGES)("accepts valid language code '%s'", async (lang: PlumeLanguage) => {
    fakeStorage.store[PLUME_CACHE_KEYS.FORCED_LANGUAGE] = lang;
    expect(await loadForcedLanguage()).toBe(lang);
  });

  it("returns undefined for an unrecognized language code", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.FORCED_LANGUAGE] = "de";
    expect(await loadForcedLanguage()).toBeUndefined();
  });

  it("returns undefined for a non-string value", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.FORCED_LANGUAGE] = 42;
    expect(await loadForcedLanguage()).toBeUndefined();
  });
});

describe("loadHotkeys", () => {
  it("returns the stored KeyBindingMap when key is present", async () => {
    const overloadedHotkeys: Record<HotkeyAction, KeyBinding> = {
      ...DEFAULT_HOTKEYS,
      [HotkeyAction.FULLSCREEN]: { code: "KeyN", label: "N", ctrl: true },
    };
    fakeStorage.store[PLUME_CACHE_KEYS.HOTKEY_BINDINGS] = overloadedHotkeys;

    expect(await loadHotkeys()).toEqual(overloadedHotkeys);
  });

  it("returns undefined when key is absent", async () => {
    expect(await loadHotkeys()).toBeUndefined();
  });
});

describe("loadFeatureFlags", () => {
  it("returns defaults when key is absent", async () => {
    expect(await loadFeatureFlags()).toEqual(PLUME_DEFAULTS.featureFlags);
  });

  it("returns stored flags when present", async () => {
    const custom: FeatureFlags = { ...PLUME_DEFAULTS.featureFlags, fullscreen: false };
    fakeStorage.store[PLUME_CACHE_KEYS.FEATURE_FLAGS] = custom;
    expect(await loadFeatureFlags()).toEqual(custom);
  });

  it("merges with defaults when stored object is partial (forward-compat)", async () => {
    // Simulate a stored object missing a newly-added flag
    fakeStorage.store[PLUME_CACHE_KEYS.FEATURE_FLAGS] = { loopModes: false };
    const result = await loadFeatureFlags();
    expect(result.loopModes).toBe(false);
    expect(result.goToTrack).toBe(true);
    expect(result.fullscreen).toBe(true);
  });

  it("returns defaults when stored value is not an object", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.FEATURE_FLAGS] = "invalid";
    expect(await loadFeatureFlags()).toEqual(PLUME_DEFAULTS.featureFlags);
  });

  it("returns defaults when stored value is null", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.FEATURE_FLAGS] = null;
    expect(await loadFeatureFlags()).toEqual(PLUME_DEFAULTS.featureFlags);
  });
});
