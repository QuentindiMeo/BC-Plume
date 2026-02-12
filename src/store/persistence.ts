import { browserCache } from "../utils/browser";
import { PLUME_CACHE_KEYS } from "../types";
import { CPL, logger } from "../utils/logger";
import { getString } from "../utils/i18n";
import { ACTION_TYPES, type Store } from "./store";

export async function loadPersistedState(store: Store): Promise<void> {
  try {
    const keys = [PLUME_CACHE_KEYS.VOLUME, PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD];
    const result = await browserCache.get(keys);

    if (result[PLUME_CACHE_KEYS.VOLUME] !== undefined) {
      const volume = result[PLUME_CACHE_KEYS.VOLUME];
      if (typeof volume === "number") {
        const volumeClamped = Math.max(0, Math.min(1, volume)); // Ensure volume is between 0 and 1
        store.dispatch({ type: ACTION_TYPES.SET_VOLUME, payload: volumeClamped });

        if (volumeClamped === 0) {
          store.dispatch({ type: ACTION_TYPES.SET_IS_MUTED, payload: true });
        }
        logger(CPL.INFO, getString("INFO__VOLUME__LOADED"), `${Math.round(volumeClamped * 100)}%`);
      }
    }

    if (result[PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD] !== undefined) {
      const method = result[PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD];
      if (method === "duration" || method === "remaining") {
        store.dispatch({ type: ACTION_TYPES.SET_DURATION_DISPLAY_METHOD, payload: method });
        logger(CPL.INFO, getString("INFO__TIME_DISPLAY_METHOD__APPLIED"), method);
      }
    }
  } catch (error) {
    logger(CPL.ERROR, getString("ERROR__STATE__LOAD_FAILED"), error);
  }
}
