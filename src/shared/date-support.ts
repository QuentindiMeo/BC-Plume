/**
 * ? Engine capability probe for Bandcamp's release-date serialization.
 *
 * ! Bandcamp stores release dates as `"12 Apr 2019 00:00:00 GMT"` — an RFC-2822-style string, not ISO 8601.
 * * ECMA-262 only mandates parsing of the ISO 8601 format; everything else is implementation-defined, so an
 * * engine may reject the string (→ `NaN`) or, worse, resolve it to a different instant (e.g. treating the
 * * zone designator as local time), which would render a silently wrong date rather than no date.
 *
 * ! Rather than trusting that every engine behaves like V8, probe it against known-answer samples and let the
 * ! caller degrade gracefully. `Date.UTC` is spec-defined, so the expected instants are engine-independent.
 */

export interface DateParseProbeFailure {
  input: string;
  expected: number;
  parsed: number;
}

export type DateParser = (raw: string) => number;

const parseWithEngine: DateParser = (raw) => new Date(raw).getTime();

// Samples in Bandcamp's exact serialization, paired with the instant a conforming parse must produce.
const NON_ISO_PROBES: ReadonlyArray<readonly [string, number]> = [
  ["12 Apr 2019 00:00:00 GMT", Date.UTC(2019, 3, 12)], // canonical Bandcamp value
  ["01 Jan 2020 00:00:00 GMT", Date.UTC(2020, 0, 1)], // year boundary
  ["29 Feb 2024 00:00:00 GMT", Date.UTC(2024, 1, 29)], // leap day
  ["31 Dec 2021 23:59:59 GMT", Date.UTC(2021, 11, 31, 23, 59, 59)], // day boundary, non-zero time
];

/** Returns one entry per sample the engine parses to the wrong instant (or not at all). Empty means healthy. */
export const probeNonIsoDateParsing = (parse: DateParser = parseWithEngine): DateParseProbeFailure[] =>
  NON_ISO_PROBES.flatMap(([input, expected]) => {
    let parsed: number;
    try {
      parsed = parse(input);
    } catch {
      parsed = NaN; // a parser that throws is as unusable as one that returns NaN
    }

    return parsed === expected ? [] : [{ input, expected, parsed }];
  });

export const isNonIsoDateParsingSupported = (parse?: DateParser): boolean => probeNonIsoDateParsing(parse).length === 0;
