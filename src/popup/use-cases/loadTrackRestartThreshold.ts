import { PLUME_CACHE_KEYS } from "@/domain/browser";
import {
  assertBoundedInteger,
  TRACK_RESTART_THRESHOLD_MAX,
  TRACK_RESTART_THRESHOLD_MIN,
  WholeNumber,
} from "@/domain/plume";
import { inferBrowserApi } from "@/shared/browser";

export const loadTrackRestartThreshold = async (): Promise<WholeNumber | undefined> => {
  const browserApi = inferBrowserApi();

  const cache = await browserApi.storage.local.get([PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD]);
  const value = cache[PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD];

  try {
    assertBoundedInteger(value, TRACK_RESTART_THRESHOLD_MIN, TRACK_RESTART_THRESHOLD_MAX);
    return value;
  } catch {
    return undefined;
  }
};
