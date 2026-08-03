import { BC_ELEM_SELECTORS, BcElementKey } from "@/infra/elements/bandcamp";
import { type DateParseProbeFailure, probeNonIsoDateParsing } from "@/shared/date-support";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

export interface BcHealthCheckResult {
  allRequiredFound: boolean;
  missing: Array<{ key: string; selector: string; required: boolean }>;
}

export interface BcDateParsingHealthCheckResult {
  canParseReleaseDates: boolean;
  failures: DateParseProbeFailure[];
}

/**
 * ? Verifies this engine parses Bandcamp's non-ISO release-date format to the correct instant.
 *
 * * Non-blocking: release dates are decoration, so a failure only downgrades the fullscreen overlay
 * * (presentReleaseDate hides the date) — it must never abort initialization.
 */
export const checkReleaseDateParsing = (): BcDateParsingHealthCheckResult => {
  const failures = probeNonIsoDateParsing();

  failures.forEach(({ input, expected, parsed }) =>
    logger(
      CPL.WARN,
      getString("WARN__DATE_HEALTH_CHECK__UNSUPPORTED_FORMAT", [
        input,
        new Date(expected).toISOString(),
        Number.isNaN(parsed) ? "NaN" : new Date(parsed).toISOString(),
      ])
    )
  );

  if (failures.length === 0) logger(CPL.DEBUG, getString("DEBUG__DATE_HEALTH_CHECK__SUPPORTED"));

  return { canParseReleaseDates: failures.length === 0, failures };
};

// ? Selectors that only exist on collection pages (/album/*)
const ALBUM_ONLY_KEYS = new Set<BcElementKey>([
  "collectionPageCurrentTrackTitle",
  "trackList",
  "trackRow",
  "playStatus",
  "playableTrack",
  "trackTitle",
  "unplayableTrackTitle",
  "trackDuration",
]);

// ? Selectors that only exist on track pages belonging to a collection
const TRACK_WITH_ALBUM_ONLY_KEYS = new Set<BcElementKey>(["fromAlbum"]);

// ? Selectors that only exist on track pages (/track/*)
const TRACK_ONLY_KEYS = new Set<BcElementKey>(["songPageCurrentTrackTitle"]);

export const checkBandcampElements = (): BcHealthCheckResult => {
  const isCollectionPage = globalThis.location.pathname.includes("/album/");

  const bcElementKeys = Object.keys(BC_ELEM_SELECTORS) as Array<BcElementKey>;
  const checks = bcElementKeys.map((key) => {
    const selector: string = BC_ELEM_SELECTORS[key];

    // ? Check is optional when the selector belongs to a page type that does not match the current page.
    const isOptional =
      TRACK_WITH_ALBUM_ONLY_KEYS.has(key) ||
      (isCollectionPage && TRACK_ONLY_KEYS.has(key)) ||
      (!isCollectionPage && ALBUM_ONLY_KEYS.has(key));

    return { key, selector, required: !isOptional };
  });

  const missing = checks.filter(({ selector }) => !document.querySelector(selector));

  const missingRequired = missing.filter((m) => m.required);
  const missingOptional = missing.filter((m) => !m.required);

  missingRequired.forEach(({ selector }) =>
    logger(CPL.ERROR, getString("ERROR__BC_HEALTH_CHECK__MISSING_REQUIRED", [selector]))
  );
  missingOptional.forEach(({ selector }) =>
    logger(CPL.INFO, getString("INFO__BC_HEALTH_CHECK__MISSING_OPTIONAL", [selector]))
  );

  // a non-conforming date parser hides release dates, it does not block initialization
  checkReleaseDateParsing();

  return {
    allRequiredFound: missingRequired.length === 0,
    missing,
  };
};
