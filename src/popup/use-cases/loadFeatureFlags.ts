import { PLUME_CACHE_KEYS } from "@/domain/browser";
import { FeatureFlags, PLUME_DEFAULTS } from "@/domain/plume";
import { inferBrowserApi } from "@/shared/browser";

export const loadFeatureFlags = async (): Promise<FeatureFlags> => {
  const browserApi = inferBrowserApi();

  const cache = await browserApi.storage.local.get([PLUME_CACHE_KEYS.FEATURE_FLAGS]);
  const stored = cache[PLUME_CACHE_KEYS.FEATURE_FLAGS];

  if (stored !== undefined && typeof stored === "object" && stored !== null) {
    return { ...PLUME_DEFAULTS.featureFlags, ...stored };
  }
  return { ...PLUME_DEFAULTS.featureFlags };
};
