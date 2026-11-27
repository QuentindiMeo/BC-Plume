import { describe, expect, it } from "vitest";

import { isNonIsoDateParsingSupported, probeNonIsoDateParsing, type DateParser } from "@/shared/date-support";

const CANONICAL_SAMPLE = "12 Apr 2019 00:00:00 GMT";

describe("probeNonIsoDateParsing", () => {
  it("reports no failures on this engine", () => {
    expect(probeNonIsoDateParsing()).toEqual([]);
  });

  it("reports every sample when the engine cannot parse the format at all", () => {
    const rejectAll: DateParser = () => NaN;

    const failures = probeNonIsoDateParsing(rejectAll);

    expect(failures.length).toBeGreaterThan(0);
    expect(failures.every(({ parsed }) => Number.isNaN(parsed))).toBe(true);
    expect(failures.map(({ input }) => input)).toContain(CANONICAL_SAMPLE);
  });

  it("reports samples parsed to the wrong instant (zone designator ignored)", () => {
    // ? Mimics an engine that reads "GMT" as local time: parsable, but off by the UTC offset.
    const offBySixHours: DateParser = (raw) => new Date(raw).getTime() + 6 * 60 * 60 * 1000;

    const failures = probeNonIsoDateParsing(offBySixHours);

    expect(failures.length).toBeGreaterThan(0);
    failures.forEach(({ expected, parsed }) => expect(parsed).not.toBe(expected));
  });

  it("reports a parser that throws as a failure rather than propagating", () => {
    const throwingParser: DateParser = () => {
      throw new RangeError("unsupported date format");
    };

    const failures = probeNonIsoDateParsing(throwingParser);

    expect(failures.length).toBeGreaterThan(0);
    expect(failures.every(({ parsed }) => Number.isNaN(parsed))).toBe(true);
  });

  it("reports only the samples that fail when the engine is partially conforming", () => {
    // ? Mimics an engine that handles the canonical sample but mishandles the leap day.
    const brokenLeapDay: DateParser = (raw) => (raw.includes("29 Feb") ? NaN : new Date(raw).getTime());

    const failures = probeNonIsoDateParsing(brokenLeapDay);

    expect(failures).toHaveLength(1);
    expect(failures[0]?.input).toContain("29 Feb");
  });

  it("exposes the expected instant alongside what the engine produced", () => {
    const failures = probeNonIsoDateParsing(() => NaN);
    const canonical = failures.find(({ input }) => input === CANONICAL_SAMPLE);

    expect(canonical?.expected).toBe(Date.UTC(2019, 3, 12));
  });
});

describe("isNonIsoDateParsingSupported", () => {
  it("returns true on this engine", () => {
    expect(isNonIsoDateParsingSupported()).toBe(true);
  });

  it("returns true for a conforming parser", () => {
    expect(isNonIsoDateParsingSupported((raw) => new Date(raw).getTime())).toBe(true);
  });

  it("returns false when the parser rejects the format", () => {
    expect(isNonIsoDateParsingSupported(() => NaN)).toBe(false);
  });

  it("returns false when the parser is off by a timezone offset", () => {
    expect(isNonIsoDateParsingSupported((raw) => new Date(raw).getTime() + 3_600_000)).toBe(false);
  });
});
