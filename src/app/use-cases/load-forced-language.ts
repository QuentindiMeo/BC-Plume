import { PLUME_CACHE_KEYS } from "@/domain/browser";
import { PLUME_SUPPORTED_LANGUAGES, type PlumeLanguage } from "@/domain/plume";
import { inferBrowserApi } from "@/shared/browser";

export const loadForcedLanguage = async (): Promise<PlumeLanguage | undefined> => {
  const browserApi = inferBrowserApi();

  const cache = await browserApi.storage.local.get([PLUME_CACHE_KEYS.FORCED_LANGUAGE]);
  const value = cache[PLUME_CACHE_KEYS.FORCED_LANGUAGE];

  if (PLUME_SUPPORTED_LANGUAGES.includes(value)) {
    return value as PlumeLanguage;
  }
  return undefined;
};
