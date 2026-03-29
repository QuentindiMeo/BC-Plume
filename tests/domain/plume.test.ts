import {
  assertBoundedInteger,
  assertWholeNumber,
  LOOP_MODE,
  LOOP_MODE_CYCLE,
  PLUME_DEFAULTS,
  SEEK_JUMP_DURATION_MAX,
  SEEK_JUMP_DURATION_MIN,
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
