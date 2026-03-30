import { launchPlume } from "@/app/features/lifecycle";
import { registerBcPlayer, registerMessageReceiver, registerMusicPlayer } from "@/app/stores/adapters";
import { getGuiInstance } from "@/app/stores/GuiImpl";
import { loadForcedLanguage } from "@/app/use-cases/load-forced-language";
import type { BcPlayerPort } from "@/domain/ports/bc-player";
import type { MusicPlayerPort } from "@/domain/ports/music-player";
import { BcPlayerAdapter, GuiAudioProvider, MusicPlayerAdapter, createRuntimeMessageReceiver } from "@/infra/adapters";
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

  // Load language before launching the app to ensure the UI reflects the correct language from the start.
  const forcedLanguage = await loadForcedLanguage();
  setForcedLanguage(forcedLanguage ?? null);

  logDetectedBrowser();
  launchPlume();
})();
