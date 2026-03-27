import { PLUME_CACHE_KEYS } from "@/src/domain/browser";
import { loadSeekJumpDuration } from "@/src/popup/use-cases/loadSeekJumpDuration";
import { loadTrackRestartThreshold } from "@/src/popup/use-cases/loadTrackRestartThreshold";
import { loadVolumeHotkeyStep } from "@/src/popup/use-cases/loadVolumeHotkeyStep";
import { inferBrowserApi } from "@/src/shared/browser";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/shared/browser", () => ({ inferBrowserApi: vi.fn() }));

let mockGet: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockGet = vi.fn();
  vi.mocked(inferBrowserApi).mockReturnValue({
    storage: { local: { get: mockGet } },
  } as unknown as ReturnType<typeof inferBrowserApi>);
});

// ---------------------------------------------------------------------------

describe("loadSeekJumpDuration", () => {
  it("returns the stored value when valid", async () => {
    mockGet.mockResolvedValue({ [PLUME_CACHE_KEYS.SEEK_JUMP_DURATION]: 10 });
    expect(await loadSeekJumpDuration()).toBe(10);
  });

  it("returns undefined when key is absent", async () => {
    mockGet.mockResolvedValue({});
    expect(await loadSeekJumpDuration()).toBeUndefined();
  });

  it("returns undefined when value is below MIN (0 < 1)", async () => {
    mockGet.mockResolvedValue({ [PLUME_CACHE_KEYS.SEEK_JUMP_DURATION]: 0 });
    expect(await loadSeekJumpDuration()).toBeUndefined();
  });

  it("returns undefined when value exceeds MAX (301 > 300)", async () => {
    mockGet.mockResolvedValue({ [PLUME_CACHE_KEYS.SEEK_JUMP_DURATION]: 301 });
    expect(await loadSeekJumpDuration()).toBeUndefined();
  });

  it("returns undefined for a float", async () => {
    mockGet.mockResolvedValue({ [PLUME_CACHE_KEYS.SEEK_JUMP_DURATION]: 10.5 });
    expect(await loadSeekJumpDuration()).toBeUndefined();
  });

  it("accepts MIN boundary (1)", async () => {
    mockGet.mockResolvedValue({ [PLUME_CACHE_KEYS.SEEK_JUMP_DURATION]: 1 });
    expect(await loadSeekJumpDuration()).toBe(1);
  });

  it("accepts MAX boundary (300)", async () => {
    mockGet.mockResolvedValue({ [PLUME_CACHE_KEYS.SEEK_JUMP_DURATION]: 300 });
    expect(await loadSeekJumpDuration()).toBe(300);
  });
});

// ---------------------------------------------------------------------------

describe("loadVolumeHotkeyStep", () => {
  it("returns the stored value when valid", async () => {
    mockGet.mockResolvedValue({ [PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP]: 5 });
    expect(await loadVolumeHotkeyStep()).toBe(5);
  });

  it("returns undefined when key is absent", async () => {
    mockGet.mockResolvedValue({});
    expect(await loadVolumeHotkeyStep()).toBeUndefined();
  });

  it("returns undefined when value is below MIN (0 < 1)", async () => {
    mockGet.mockResolvedValue({ [PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP]: 0 });
    expect(await loadVolumeHotkeyStep()).toBeUndefined();
  });

  it("returns undefined when value exceeds MAX (21 > 20)", async () => {
    mockGet.mockResolvedValue({ [PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP]: 21 });
    expect(await loadVolumeHotkeyStep()).toBeUndefined();
  });

  it("returns undefined for a float", async () => {
    mockGet.mockResolvedValue({ [PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP]: 2.5 });
    expect(await loadVolumeHotkeyStep()).toBeUndefined();
  });

  it("accepts MIN boundary (1)", async () => {
    mockGet.mockResolvedValue({ [PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP]: 1 });
    expect(await loadVolumeHotkeyStep()).toBe(1);
  });

  it("accepts MAX boundary (20)", async () => {
    mockGet.mockResolvedValue({ [PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP]: 20 });
    expect(await loadVolumeHotkeyStep()).toBe(20);
  });
});

// ---------------------------------------------------------------------------

describe("loadTrackRestartThreshold", () => {
  it("returns the stored value when valid", async () => {
    mockGet.mockResolvedValue({ [PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD]: 5 });
    expect(await loadTrackRestartThreshold()).toBe(5);
  });

  it("returns undefined when key is absent", async () => {
    mockGet.mockResolvedValue({});
    expect(await loadTrackRestartThreshold()).toBeUndefined();
  });

  it("accepts 0 (lower bound is 0, not 1)", async () => {
    mockGet.mockResolvedValue({ [PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD]: 0 });
    expect(await loadTrackRestartThreshold()).toBe(0);
  });

  it("accepts MAX boundary (10)", async () => {
    mockGet.mockResolvedValue({ [PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD]: 10 });
    expect(await loadTrackRestartThreshold()).toBe(10);
  });

  it("returns undefined when value exceeds MAX (11 > 10)", async () => {
    mockGet.mockResolvedValue({ [PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD]: 11 });
    expect(await loadTrackRestartThreshold()).toBeUndefined();
  });

  it("returns undefined for a float", async () => {
    mockGet.mockResolvedValue({ [PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD]: 1.5 });
    expect(await loadTrackRestartThreshold()).toBeUndefined();
  });
});
