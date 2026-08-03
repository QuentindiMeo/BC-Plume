import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DateParseProbeFailure } from "@/shared/date-support";
import type { CPL } from "@/shared/logger";

let probeFailures: DateParseProbeFailure[] = [];

vi.mock("@/shared/date-support", () => ({ probeNonIsoDateParsing: () => probeFailures }));
vi.mock("@/shared/logger", () => ({
  CPL: { DEBUG: "debug", INFO: "info", WARN: "warn", ERROR: "error" },
  logger: vi.fn(),
}));

import { checkReleaseDateParsing } from "@/app/features/bc-diagnostic";
import { logger } from "@/shared/logger";

const CANONICAL_SAMPLE = "12 Apr 2019 00:00:00 GMT";

beforeEach(() => {
  vi.mocked(logger).mockClear();
  probeFailures = [];
});

describe("checkReleaseDateParsing", () => {
  it("reports a healthy engine and logs at debug level", () => {
    const result = checkReleaseDateParsing();

    expect(result).toEqual({ canParseReleaseDates: true, failures: [] });
    expect(logger).toHaveBeenCalledWith("debug", "Bandcamp release date format parsed correctly by this browser");
  });

  it("reports an engine that cannot parse the format, and warns", () => {
    probeFailures = [{ input: CANONICAL_SAMPLE, expected: Date.UTC(2019, 3, 12), parsed: NaN }];

    const result = checkReleaseDateParsing();

    expect(result.canParseReleaseDates).toBe(false);
    expect(result.failures).toHaveLength(1);
    expect(logger).toHaveBeenCalledTimes(1);

    const [level, message] = vi.mocked(logger).mock.calls[0] as [CPL, string];
    expect(level).toBe("warn");
    expect(message).toContain(CANONICAL_SAMPLE);
    expect(message).toContain("2019-04-12T00:00:00.000Z"); // expected instant
    expect(message).toContain("NaN"); // what the engine produced
  });

  it("renders the wrongly-parsed instant when the engine parses to the wrong time", () => {
    probeFailures = [{ input: CANONICAL_SAMPLE, expected: Date.UTC(2019, 3, 12), parsed: Date.UTC(2019, 3, 11, 18) }];

    checkReleaseDateParsing();

    const [, message] = vi.mocked(logger).mock.calls[0] as [CPL, string];
    expect(message).toContain("2019-04-11T18:00:00.000Z");
    expect(message).not.toContain("NaN");
  });

  it("logs one warning per failing sample and no success line", () => {
    probeFailures = [
      { input: CANONICAL_SAMPLE, expected: Date.UTC(2019, 3, 12), parsed: NaN },
      { input: "29 Feb 2024 00:00:00 GMT", expected: Date.UTC(2024, 1, 29), parsed: NaN },
    ];

    checkReleaseDateParsing();

    expect(logger).toHaveBeenCalledTimes(2);
    expect(vi.mocked(logger).mock.calls.every(([level]: [CPL]) => level === "warn")).toBe(true);
  });
});
