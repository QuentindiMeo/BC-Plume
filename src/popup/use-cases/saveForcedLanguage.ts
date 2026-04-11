import { PLUME_CACHE_KEYS } from "@/domain/browser";
import { PLUME_SUPPORTED_LANGUAGES, type PlumeLanguage } from "@/domain/plume";
import { inferBrowserApi } from "@/shared/browser";

export const saveForcedLanguage = async (lang: PlumeLanguage): Promise<void> => {
  if (!(PLUME_SUPPORTED_LANGUAGES as readonly unknown[]).includes(lang)) {
    throw new RangeError(`Unsupported language code: "${lang}"`);
  }

  const browserApi = inferBrowserApi();

  await browserApi.storage.local.set({ [PLUME_CACHE_KEYS.FORCED_LANGUAGE]: lang });
};
