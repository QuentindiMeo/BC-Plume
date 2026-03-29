import { APP_VERSION } from "@/domain/meta";
import { PLUME_CACHE_KEYS } from "@/domain/browser";
import type { IBrowserCache } from "@/domain/ports/browser";

export const shouldShowReleaseToast = async (cache: IBrowserCache): Promise<boolean> => {
  const result = await cache.get([PLUME_CACHE_KEYS.LAST_SEEN_RELEASE]);
  return result[PLUME_CACHE_KEYS.LAST_SEEN_RELEASE] !== APP_VERSION;
};
