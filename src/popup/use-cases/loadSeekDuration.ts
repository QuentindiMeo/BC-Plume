import { PLUME_CACHE_KEYS } from "../../domain/browser";
import { ValidSeekDuration } from "../../domain/plume";
import { inferBrowserApi } from "../../shared/browser";

export const loadSeekDuration = async (): Promise<ValidSeekDuration | undefined> => {
  const browserApi = inferBrowserApi();

  const cache = await browserApi.storage.local.get([PLUME_CACHE_KEYS.SEEK_DURATION]);
  const value = cache[PLUME_CACHE_KEYS.SEEK_DURATION];

  return value === undefined ? undefined : (value as ValidSeekDuration);
};
