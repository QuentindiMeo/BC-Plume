import { APP_VERSION } from "../../domain/meta";
import { PLUME_CACHE_KEYS } from "../../domain/browser";
import { getBrowserInstance } from "../stores/BrowserImpl";

export const shouldShowVersionToast = async (): Promise<boolean> => {
  const cache = getBrowserInstance().getState().cache;
  const result = await cache.get([PLUME_CACHE_KEYS.LAST_SEEN_VERSION]);
  return result[PLUME_CACHE_KEYS.LAST_SEEN_VERSION] !== APP_VERSION;
};
