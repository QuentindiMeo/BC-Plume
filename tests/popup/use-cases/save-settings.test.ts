import { BANDCAMP_TAB_PATTERN, PLUME_CACHE_KEYS } from "@/domain/browser";
import { DEFAULT_HOTKEYS, HotkeyAction } from "@/domain/hotkeys";
import { PLUME_MESSAGE_TYPE } from "@/domain/messages";
import type { WholeNumber } from "@/domain/plume";
import { resetHotkeys } from "@/popup/use-cases/resetHotkeys";
import { saveHotkeys } from "@/popup/use-cases/saveHotkeys";
import { saveSeekJumpDuration } from "@/popup/use-cases/saveSeekJumpDuration";
import { saveTrackRestartThreshold } from "@/popup/use-cases/saveTrackRestartThreshold";
import { saveVolumeHotkeyStep } from "@/popup/use-cases/saveVolumeHotkeyStep";
import { inferBrowserApi } from "@/shared/browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeBrowserLocalStorage } from "../../fakes/FakeBrowserLocalStorage";
import { FakeMessageSender } from "../../fakes/FakeMessageSender";

vi.mock("@/shared/browser", () => ({ inferBrowserApi: vi.fn() }));

let fakeStorage: FakeBrowserLocalStorage;
let fakeSender: FakeMessageSender;

beforeEach(() => {
  fakeStorage = new FakeBrowserLocalStorage();
  fakeSender = new FakeMessageSender();
  vi.mocked(inferBrowserApi).mockReturnValue({
    storage: { local: fakeStorage },
  } as unknown as ReturnType<typeof inferBrowserApi>);
});

describe("saveSeekJumpDuration", () => {
  it("persists the value under the correct storage key", async () => {
    await saveSeekJumpDuration(10 as WholeNumber, fakeSender);
    expect(fakeStorage.store[PLUME_CACHE_KEYS.SEEK_JUMP_DURATION]).toBe(10);
  });

  it("broadcasts SEEK_JUMP_DURATION_UPDATED with the saved value", async () => {
    await saveSeekJumpDuration(10 as WholeNumber, fakeSender);
    expect(fakeSender.broadcasts[0]).toEqual({
      urlPattern: BANDCAMP_TAB_PATTERN,
      message: { type: PLUME_MESSAGE_TYPE.SEEK_JUMP_DURATION_UPDATED, seekJumpDuration: 10 },
    });
  });

  it("throws and does not persist when value is out of range", async () => {
    await expect(saveSeekJumpDuration(0 as WholeNumber, fakeSender)).rejects.toThrow(RangeError);
    expect(Object.keys(fakeStorage.store)).toHaveLength(0);
  });
});

describe("saveVolumeHotkeyStep", () => {
  it("persists the value under the correct storage key", async () => {
    await saveVolumeHotkeyStep(5 as WholeNumber, fakeSender);
    expect(fakeStorage.store[PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP]).toBe(5);
  });

  it("broadcasts VOLUME_HOTKEY_STEP_UPDATED with the saved value", async () => {
    await saveVolumeHotkeyStep(5 as WholeNumber, fakeSender);
    expect(fakeSender.broadcasts[0]).toEqual({
      urlPattern: BANDCAMP_TAB_PATTERN,
      message: { type: PLUME_MESSAGE_TYPE.VOLUME_HOTKEY_STEP_UPDATED, volumeHotkeyStep: 5 },
    });
  });

  it("throws and does not persist when value exceeds MAX", async () => {
    await expect(saveVolumeHotkeyStep(21 as WholeNumber, fakeSender)).rejects.toThrow(RangeError);
    expect(Object.keys(fakeStorage.store)).toHaveLength(0);
  });
});

describe("saveTrackRestartThreshold", () => {
  it("persists the value under the correct storage key", async () => {
    await saveTrackRestartThreshold(5 as WholeNumber, fakeSender);
    expect(fakeStorage.store[PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD]).toBe(5);
  });

  it("broadcasts TRACK_RESTART_THRESHOLD_UPDATED with the saved value", async () => {
    await saveTrackRestartThreshold(5 as WholeNumber, fakeSender);
    expect(fakeSender.broadcasts[0]).toEqual({
      urlPattern: BANDCAMP_TAB_PATTERN,
      message: { type: PLUME_MESSAGE_TYPE.TRACK_RESTART_THRESHOLD_UPDATED, trackRestartThreshold: 5 },
    });
  });

  it("accepts 0 (lower bound for this setting)", async () => {
    await saveTrackRestartThreshold(0 as WholeNumber, fakeSender);
    expect(fakeStorage.store[PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD]).toBe(0);
  });

  it("throws and does not persist when value exceeds MAX", async () => {
    await expect(saveTrackRestartThreshold(11 as WholeNumber, fakeSender)).rejects.toThrow(RangeError);
    expect(Object.keys(fakeStorage.store)).toHaveLength(0);
  });
});

const customBindings = {
  [HotkeyAction.PLAY_PAUSE]: { code: "KeyP", label: "P" },
} as Record<HotkeyAction, (typeof DEFAULT_HOTKEYS)[HotkeyAction.PLAY_PAUSE]>;

describe("saveHotkeys", () => {
  it("persists bindings under the correct storage key", async () => {
    await saveHotkeys(customBindings, fakeSender);
    expect(fakeStorage.store[PLUME_CACHE_KEYS.HOTKEY_BINDINGS]).toEqual(customBindings);
  });

  it("broadcasts HOTKEYS_UPDATED with the binding map", async () => {
    await saveHotkeys(customBindings, fakeSender);
    expect(fakeSender.broadcasts[0]).toEqual({
      urlPattern: BANDCAMP_TAB_PATTERN,
      message: { type: PLUME_MESSAGE_TYPE.HOTKEYS_UPDATED, bindings: customBindings },
    });
  });
});

describe("resetHotkeys", () => {
  it("removes the hotkey bindings from storage", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.HOTKEY_BINDINGS] = DEFAULT_HOTKEYS;
    await resetHotkeys(fakeSender);
    expect(PLUME_CACHE_KEYS.HOTKEY_BINDINGS in fakeStorage.store).toBe(false);
  });

  it("broadcasts HOTKEYS_UPDATED with DEFAULT_HOTKEYS", async () => {
    await resetHotkeys(fakeSender);
    expect(fakeSender.broadcasts[0]).toEqual({
      urlPattern: BANDCAMP_TAB_PATTERN,
      message: { type: PLUME_MESSAGE_TYPE.HOTKEYS_UPDATED, bindings: DEFAULT_HOTKEYS },
    });
  });
});
