import { TIME_DISPLAY_METHOD } from "@/domain/plume";
import {
    presentFormattedDuration,
    presentFormattedElapsed,
    presentFormattedTime,
    presentProgressPercentage,
} from "@/shared/presenters";
import { describe, expect, it } from "vitest";

describe("presentFormattedTime", () => {
  it("returns '0:00' for 0 seconds", () => {
    expect(presentFormattedTime(0)).toBe("0:00");
  });

  it("formats 65 seconds as '1:05'", () => {
    expect(presentFormattedTime(65)).toBe("1:05");
  });

  it("formats 3600 seconds as '60:00'", () => {
    expect(presentFormattedTime(3600)).toBe("60:00");
  });

  it("zero-pads single-digit seconds: 59 → '0:59'", () => {
    expect(presentFormattedTime(59)).toBe("0:59");
  });

  it("returns INITIAL_TIME_DISPLAY for negative values", () => {
    expect(presentFormattedTime(-1)).toBe("0:00");
  });

  it("returns INITIAL_TIME_DISPLAY for NaN", () => {
    expect(presentFormattedTime(NaN)).toBe("0:00");
  });

  it("returns INITIAL_TIME_DISPLAY for Infinity", () => {
    expect(presentFormattedTime(Infinity)).toBe("0:00");
  });
});

describe("presentFormattedElapsed", () => {
  it("delegates to presentFormattedTime using currentTime", () => {
    const state = {
      currentTime: 65,
      duration: 120,
      durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION,
    };
    expect(presentFormattedElapsed(state)).toBe("1:05");
  });

  it("returns '0:00' when currentTime is 0", () => {
    const state = {
      currentTime: 0,
      duration: 120,
      durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION,
    };
    expect(presentFormattedElapsed(state)).toBe("0:00");
  });
});

describe("presentFormattedDuration", () => {
  describe("with DURATION display method", () => {
    it("returns formatted total duration", () => {
      const state = {
        currentTime: 30,
        duration: 90,
        durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION,
      };
      expect(presentFormattedDuration(state)).toBe("1:30");
    });

    it("returns '0:00' when duration is 0", () => {
      const state = {
        currentTime: 0,
        duration: 0,
        durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION,
      };
      expect(presentFormattedDuration(state)).toBe("0:00");
    });
  });

  describe("with REMAINING display method", () => {
    it("returns '-' + formatted remaining time (30/90 → '-1:00')", () => {
      const state = {
        currentTime: 30,
        duration: 90,
        durationDisplayMethod: TIME_DISPLAY_METHOD.REMAINING,
      };
      expect(presentFormattedDuration(state)).toBe("-1:00");
    });

    it("returns '-0:00' when currentTime equals duration", () => {
      const state = {
        currentTime: 120,
        duration: 120,
        durationDisplayMethod: TIME_DISPLAY_METHOD.REMAINING,
      };
      expect(presentFormattedDuration(state)).toBe("-0:00");
    });

    it("returns full duration as remaining when currentTime is 0", () => {
      const state = {
        currentTime: 0,
        duration: 65,
        durationDisplayMethod: TIME_DISPLAY_METHOD.REMAINING,
      };
      expect(presentFormattedDuration(state)).toBe("-1:05");
    });
  });
});

describe("presentProgressPercentage", () => {
  it("returns 0 when duration is 0", () => {
    expect(presentProgressPercentage({ currentTime: 0, duration: 0, durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION })).toBe(0);
  });

  it("returns 50 at the midpoint (50/100)", () => {
    expect(presentProgressPercentage({ currentTime: 50, duration: 100, durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION })).toBe(50);
  });

  it("returns 100 at the end (100/100)", () => {
    expect(presentProgressPercentage({ currentTime: 100, duration: 100, durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION })).toBe(100);
  });

  it("returns 0 at the start (0/120)", () => {
    expect(presentProgressPercentage({ currentTime: 0, duration: 120, durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION })).toBe(0);
  });
});
