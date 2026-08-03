import { describe, expect, it } from "vitest";

import { TIME_DISPLAY_METHOD } from "@/domain/plume";
import {
  presentFormattedDuration,
  presentFormattedElapsed,
  presentFormattedTime,
  presentProgressPercentage,
  presentReleaseDate,
} from "@/shared/presenters";

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
    expect(
      presentProgressPercentage({ currentTime: 0, duration: 0, durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION })
    ).toBe(0);
  });

  it("returns 50 at the midpoint (50/100)", () => {
    expect(
      presentProgressPercentage({ currentTime: 50, duration: 100, durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION })
    ).toBe(50);
  });

  it("returns 100 at the end (100/100)", () => {
    expect(
      presentProgressPercentage({
        currentTime: 100,
        duration: 100,
        durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION,
      })
    ).toBe(100);
  });

  it("returns 0 at the start (0/120)", () => {
    expect(
      presentProgressPercentage({ currentTime: 0, duration: 120, durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION })
    ).toBe(0);
  });
});

describe("presentReleaseDate", () => {
  it("formats Bandcamp's raw date in English", () => {
    expect(presentReleaseDate("12 Apr 2019 00:00:00 GMT", "en")).toBe("April 12, 2019");
  });

  it("localizes the formatted date", () => {
    expect(presentReleaseDate("12 Apr 2019 00:00:00 GMT", "fr")).toBe("12 avril 2019");
  });

  it("normalizes underscored locale tags to BCP-47 (pt_BR → pt-BR)", () => {
    expect(presentReleaseDate("12 Apr 2019 00:00:00 GMT", "pt_BR")).toBe("12 de abril de 2019");
  });

  it("accepts an ISO date without a time component", () => {
    expect(presentReleaseDate("2019-04-12", "en")).toBe("April 12, 2019");
  });

  // Both bounds of the GMT day must land on the same calendar day: in any non-UTC runner timezone,
  // formatting without `timeZone: "UTC"` would shift one of them.
  it("keeps the GMT calendar day at the start of the day", () => {
    expect(presentReleaseDate("12 Apr 2019 00:00:00 GMT", "en")).toBe("April 12, 2019");
  });

  it("keeps the GMT calendar day at the end of the day", () => {
    expect(presentReleaseDate("12 Apr 2019 23:59:00 GMT", "en")).toBe("April 12, 2019");
  });

  it("returns null for an empty string", () => {
    expect(presentReleaseDate("", "en")).toBeNull();
  });

  it("returns null for a non-date string", () => {
    expect(presentReleaseDate("not a date", "en")).toBeNull();
  });

  it("returns null for localized page text rather than a raw date", () => {
    expect(presentReleaseDate("released April 12, 2019", "en")).toBeNull();
  });
});
