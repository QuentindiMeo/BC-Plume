import { launchPlume } from "@/app/features/lifecycle";
import { registerBcPlayer, registerMessageReceiver, registerMusicPlayer } from "@/app/stores/adapters";
import { getGuiInstance } from "@/app/stores/GuiImpl";
import { PLUME_CACHE_KEYS } from "@/domain/browser";
import { PLUME_LANGUAGE_AUTO, PLUME_SUPPORTED_LANGUAGES, type PlumeLanguage } from "@/domain/plume";
import type { BcPlayerPort } from "@/domain/ports/bc-player";
import type { MusicPlayerPort } from "@/domain/ports/music-player";
import { BcPlayerAdapter, GuiAudioProvider, MusicPlayerAdapter, createRuntimeMessageReceiver } from "@/infra/adapters";
import { inferBrowserApi } from "@/shared/browser";
import { logDetectedBrowser, setForcedLanguage } from "@/shared/i18n";

(async () => {
  "use strict";

  const audioProvider = new GuiAudioProvider(getGuiInstance);
  const bandcampPlayer = new BcPlayerAdapter();
  const musicPlayer = new MusicPlayerAdapter(audioProvider);
  const messageReceiver = createRuntimeMessageReceiver();

  registerBcPlayer(bandcampPlayer satisfies BcPlayerPort);
  registerMusicPlayer(musicPlayer satisfies MusicPlayerPort);
  registerMessageReceiver(messageReceiver);

  const browserApi = inferBrowserApi();
  const cache = await browserApi.storage.local.get([PLUME_CACHE_KEYS.FORCED_LANGUAGE]);
  const storedLang = cache[PLUME_CACHE_KEYS.FORCED_LANGUAGE];
  const forcedLanguage = (PLUME_SUPPORTED_LANGUAGES as readonly unknown[]).includes(storedLang)
    ? (storedLang as PlumeLanguage)
    : PLUME_LANGUAGE_AUTO;
  setForcedLanguage(forcedLanguage);

  logDetectedBrowser();
  launchPlume();
})();
