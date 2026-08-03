/**
 * ! presentReleaseDate on a non-conforming engine: Bandcamp's RFC-2822-style format must be refused
 * ! (no date beats a wrong date), while spec-mandated ISO 8601 parsing keeps working.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/date-support", () => ({ isNonIsoDateParsingSupported: () => false }));

import { presentReleaseDate } from "@/shared/presenters";

describe("presentReleaseDate when the engine fails the date-parsing healthcheck", () => {
  it("refuses Bandcamp's non-ISO format instead of risking a wrong date", () => {
    expect(presentReleaseDate("12 Apr 2019 00:00:00 GMT", "en")).toBeNull();
  });

  it("still formats a plain ISO date", () => {
    expect(presentReleaseDate("2019-04-12", "en")).toBe("April 12, 2019");
  });

  it("still formats an ISO datetime", () => {
    expect(presentReleaseDate("2019-04-12T00:00:00Z", "en")).toBe("April 12, 2019");
  });

  it("still refuses non-date input", () => {
    expect(presentReleaseDate("not a date", "en")).toBeNull();
  });
});
