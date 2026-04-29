import { launchPlume } from "@/app/features/lifecycle";
import {
  registerBcPlayer,
  registerMessageReceiver,
  registerMusicPlayer,
  registerTrackAudio,
} from "@/app/stores/adapters";
import { getGuiInstance } from "@/app/stores/GuiImpl";
import { loadForcedLanguage } from "@/app/use-cases/load-forced-language";
import type { BcPlayerPort } from "@/domain/ports/bc-player";
import type { MusicPlayerPort } from "@/domain/ports/music-player";
import type { TrackAudioPort } from "@/domain/ports/track-audio";
import {
  BcPlayerAdapter,
  GuiAudioProvider,
  MusicPlayerAdapter,
  TrackAudioAdapter,
  createRuntimeMessageReceiver,
} from "@/infra/adapters";
import { logDetectedBrowser } from "@/shared/browser";
import { setForcedLanguage } from "@/shared/i18n";

(() => {
  "use strict";

  // Guard against double injection (manifest content_scripts + scripting API)
  const marker = "__plume_content_loaded__";
  if ((document as any)[marker]) return;
  (document as any)[marker] = true;

  const audioProvider = new GuiAudioProvider(getGuiInstance);
  const bandcampPlayer = new BcPlayerAdapter();
  const musicPlayer = new MusicPlayerAdapter(audioProvider);
  const messageReceiver = createRuntimeMessageReceiver();
  const trackAudio = new TrackAudioAdapter();

  registerBcPlayer(bandcampPlayer satisfies BcPlayerPort);
  registerMusicPlayer(musicPlayer satisfies MusicPlayerPort);
  registerMessageReceiver(messageReceiver);
  registerTrackAudio(trackAudio satisfies TrackAudioPort);

  // Load language before launching the app to ensure the UI reflects the correct language from the start.
  loadForcedLanguage().then((forcedLanguage) => {
    setForcedLanguage(forcedLanguage ?? null);
  });

  logDetectedBrowser();
  launchPlume();
})();
