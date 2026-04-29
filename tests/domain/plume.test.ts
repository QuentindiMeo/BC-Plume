import {
  assertBoundedInteger,
  assertWholeNumber,
  LOOP_MODE,
  LOOP_MODE_CYCLE,
  parseCustomPlaybackSpeed,
  PLAYBACK_SPEED_MAX,
  PLAYBACK_SPEED_MIN,
  PLAYBACK_SPEED_STEPS,
  PLUME_DEFAULTS,
  SEEK_JUMP_DURATION_MAX,
  SEEK_JUMP_DURATION_MIN,
  speedToSliderPosition,
  TIME_DISPLAY_METHOD,
  TRACK_RESTART_THRESHOLD_MAX,
  TRACK_RESTART_THRESHOLD_MIN,
  VOLUME_HOTKEY_STEP_MAX,
  VOLUME_HOTKEY_STEP_MIN,
  type WholeNumber,
} from "@/domain/plume";
import { describe, expect, it } from "vitest";

describe("assertWholeNumber", () => {
  it("accepts 0", () => {
    expect(() => assertWholeNumber(0)).not.toThrow();
  });

  it("accepts positive integers", () => {
    expect(() => assertWholeNumber(1)).not.toThrow();
    expect(() => assertWholeNumber(999)).not.toThrow();
  });

  it("rejects negative integers", () => {
    expect(() => assertWholeNumber(-1)).toThrow(RangeError);
  });

  it("rejects floats", () => {
    expect(() => assertWholeNumber(1.5)).toThrow(RangeError);
  });

  it("rejects NaN", () => {
    expect(() => assertWholeNumber(NaN)).toThrow(RangeError);
  });

  it("rejects Infinity", () => {
    expect(() => assertWholeNumber(Infinity)).toThrow(RangeError);
  });
});

describe("assertBoundedInteger", () => {
  const MIN = 2 as WholeNumber;
  const MAX = 8 as WholeNumber;

  it("accepts the minimum boundary", () => {
    expect(() => assertBoundedInteger(2, MIN, MAX)).not.toThrow();
  });

  it("accepts the maximum boundary", () => {
    expect(() => assertBoundedInteger(8, MIN, MAX)).not.toThrow();
  });

  it("accepts a mid-range value", () => {
    expect(() => assertBoundedInteger(5, MIN, MAX)).not.toThrow();
  });

  it("rejects a value below min", () => {
    expect(() => assertBoundedInteger(1, MIN, MAX)).toThrow(RangeError);
  });

  it("rejects a value above max", () => {
    expect(() => assertBoundedInteger(9, MIN, MAX)).toThrow(RangeError);
  });

  it("rejects a non-integer (delegates to assertWholeNumber)", () => {
    expect(() => assertBoundedInteger(3.5, MIN, MAX)).toThrow(RangeError);
  });
});

describe("LOOP_MODE_CYCLE", () => {
  it("contains exactly 3 elements", () => {
    expect(LOOP_MODE_CYCLE).toHaveLength(3);
  });

  it("follows the NONE → COLLECTION → TRACK order", () => {
    expect(LOOP_MODE_CYCLE[0]).toBe(LOOP_MODE.NONE);
    expect(LOOP_MODE_CYCLE[1]).toBe(LOOP_MODE.COLLECTION);
    expect(LOOP_MODE_CYCLE[2]).toBe(LOOP_MODE.TRACK);
  });
});

describe("PLUME_DEFAULTS", () => {
  it("has the expected durationDisplayMethod", () => {
    expect(PLUME_DEFAULTS.durationDisplayMethod).toBe(TIME_DISPLAY_METHOD.DURATION);
  });

  it("has the expected trackRestartThreshold", () => {
    expect(PLUME_DEFAULTS.trackRestartThreshold).toBe(5);
  });

  it("has the expected seekJumpDuration", () => {
    expect(PLUME_DEFAULTS.seekJumpDuration).toBe(10);
  });

  it("has the expected loopMode", () => {
    expect(PLUME_DEFAULTS.loopMode).toBe(LOOP_MODE.NONE);
  });

  it("has the expected savedVolume", () => {
    expect(PLUME_DEFAULTS.savedVolume).toBe(0.5);
  });

  it("has the expected volumeHotkeyStep", () => {
    expect(PLUME_DEFAULTS.volumeHotkeyStep).toBe(5);
  });
});

describe("speedToSliderPosition", () => {
  it.each(PLAYBACK_SPEED_STEPS.map((s, i) => [s, i]))(
    "maps predefined step %s× to integer index %i",
    (speed: number, expectedIdx: number) => {
      expect(speedToSliderPosition(speed)).toBe(expectedIdx);
    }
  );

  it("places 1.3 between index 4 (1.25×) and index 5 (1.5×)", () => {
    // t = (1.3 - 1.25) / (1.5 - 1.25) = 0.2  →  4 + 0.2 = 4.2
    expect(speedToSliderPosition(1.3)).toBeCloseTo(4.2, 10);
  });

  it("places the midpoint between two steps at exactly N + 0.5", () => {
    // midpoint of 1× (idx 3) and 1.25× (idx 4) = 1.125
    expect(speedToSliderPosition(1.125)).toBeCloseTo(3.5, 10);
  });

  it("returns 0 for a value at or below the first step", () => {
    expect(speedToSliderPosition(0.1)).toBe(0);
    expect(speedToSliderPosition(0.25)).toBe(0); // exact first step
  });

  it("returns the last index for a value at or above the last step", () => {
    const lastIdx = PLAYBACK_SPEED_STEPS.length - 1;
    expect(speedToSliderPosition(3)).toBe(lastIdx); // exact last step
    expect(speedToSliderPosition(6)).toBe(lastIdx);
  });
});

describe("parseCustomPlaybackSpeed", () => {
  it("parses a valid speed at the minimum bound", () => {
    expect(parseCustomPlaybackSpeed("0.25")).toBe(0.25);
  });

  it("parses a valid speed at the maximum bound", () => {
    expect(parseCustomPlaybackSpeed("3")).toBe(3);
  });

  it("parses a mid-range value", () => {
    expect(parseCustomPlaybackSpeed("1.5")).toBe(1.5);
  });

  it("rounds to 2 decimal places", () => {
    expect(parseCustomPlaybackSpeed("1.555")).toBe(1.56);
  });

  it("trims surrounding whitespace before parsing", () => {
    expect(parseCustomPlaybackSpeed("  2  ")).toBe(2);
  });

  it("returns null for an empty string", () => {
    expect(parseCustomPlaybackSpeed("")).toBeNull();
  });

  it("returns null for a whitespace-only string", () => {
    expect(parseCustomPlaybackSpeed("   ")).toBeNull();
  });

  it("returns null for a non-numeric string", () => {
    expect(parseCustomPlaybackSpeed("abc")).toBeNull();
  });

  it("returns null for a value below the minimum", () => {
    expect(parseCustomPlaybackSpeed("0.1")).toBeNull();
  });

  it("returns null for zero", () => {
    expect(parseCustomPlaybackSpeed("0")).toBeNull();
  });

  it("returns null for a negative value", () => {
    expect(parseCustomPlaybackSpeed("-1")).toBeNull();
  });

  it("returns null for a value above the maximum", () => {
    expect(parseCustomPlaybackSpeed("4")).toBeNull();
  });

  it("returns null for NaN string", () => {
    expect(parseCustomPlaybackSpeed("NaN")).toBeNull();
  });

  it("returns null for Infinity string", () => {
    expect(parseCustomPlaybackSpeed("Infinity")).toBeNull();
  });

  it("PLAYBACK_SPEED_MIN equals 0.25", () => {
    expect(PLAYBACK_SPEED_MIN).toBe(0.25);
  });

  it("PLAYBACK_SPEED_MAX equals 3", () => {
    expect(PLAYBACK_SPEED_MAX).toBe(3);
  });
});

describe("bound constants", () => {
  it("SEEK_JUMP_DURATION_MIN is 1", () => {
    expect(SEEK_JUMP_DURATION_MIN).toBe(1);
  });

  it("SEEK_JUMP_DURATION_MAX is 300", () => {
    expect(SEEK_JUMP_DURATION_MAX).toBe(300);
  });

  it("VOLUME_HOTKEY_STEP_MIN is 1", () => {
    expect(VOLUME_HOTKEY_STEP_MIN).toBe(1);
  });

  it("VOLUME_HOTKEY_STEP_MAX is 20", () => {
    expect(VOLUME_HOTKEY_STEP_MAX).toBe(20);
  });

  it("TRACK_RESTART_THRESHOLD_MIN is 0", () => {
    expect(TRACK_RESTART_THRESHOLD_MIN).toBe(0);
  });

  it("TRACK_RESTART_THRESHOLD_MAX is 10", () => {
    expect(TRACK_RESTART_THRESHOLD_MAX).toBe(10);
  });
});
