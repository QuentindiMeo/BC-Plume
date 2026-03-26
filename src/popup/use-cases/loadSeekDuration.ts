import { PLUME_CACHE_KEYS } from "../../domain/browser";
import { inferBrowserApi } from "../../shared/browser";

export const loadSeekDuration = async (): Promise<number | undefined> => {
  const browserApi = inferBrowserApi();

  const cache = await browserApi.storage.local.get([PLUME_CACHE_KEYS.SEEK_DURATION]);
  const value = cache[PLUME_CACHE_KEYS.SEEK_DURATION];

  return typeof value === "number" ? value : undefined;
};
