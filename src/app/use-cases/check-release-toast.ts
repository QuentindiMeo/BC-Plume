import { APP_VERSION } from "@/domain/meta";
import { PLUME_CACHE_KEYS } from "@/domain/browser";
import { getBrowserInstance } from "@/app/stores/BrowserImpl";

export const shouldShowReleaseToast = async (): Promise<boolean> => {
  const cache = getBrowserInstance().getState().cache;
  const result = await cache.get([PLUME_CACHE_KEYS.LAST_SEEN_RELEASE]);
  return result[PLUME_CACHE_KEYS.LAST_SEEN_RELEASE] !== APP_VERSION;
};
