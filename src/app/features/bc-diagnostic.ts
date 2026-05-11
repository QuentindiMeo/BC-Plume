import { BC_ELEM_SELECTORS, BcElementKey } from "@/infra/elements/bandcamp";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

export interface BcHealthCheckResult {
  allRequiredFound: boolean;
  missing: Array<{ key: string; selector: string; required: boolean }>;
}

// Selectors that only exist on collection pages (/album/*)
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

// Selectors that only exist on track pages belonging to a collection
const TRACK_WITH_ALBUM_ONLY_KEYS = new Set<BcElementKey>(["fromAlbum"]);

// Selectors that only exist on track pages (/track/*)
const TRACK_ONLY_KEYS = new Set<BcElementKey>(["songPageCurrentTrackTitle"]);

export const checkBandcampElements = (): BcHealthCheckResult => {
  const isCollectionPage = globalThis.location.pathname.includes("/album/");

  const bcElementKeys = Object.keys(BC_ELEM_SELECTORS) as Array<BcElementKey>;
  const checks = bcElementKeys.map((key) => {
    const selector: string = BC_ELEM_SELECTORS[key];

    // Check is optional when the selector belongs to a page type that does not match the current page.
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

  return {
    allRequiredFound: missingRequired.length === 0,
    missing,
  };
};
