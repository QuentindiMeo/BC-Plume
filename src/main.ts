import { registerBcPlayer, registerMusicPlayer } from "./app/stores/adapters";
import { getGuiInstance } from "./app/stores/GuiImpl";
import { logDetectedBrowser } from "./shared/i18n";
import { launchPlume } from "./app/features/lifecycle";
import { BcPlayerAdapter, GuiAudioProvider, MusicPlayerAdapter } from "./infra/adapters";
import type { BcPlayerPort } from "./domain/ports/bc-player";
import type { MusicPlayerPort } from "./domain/ports/music-player";

(() => {
  "use strict";

  const audioProvider = new GuiAudioProvider(getGuiInstance);
  const bandcampPlayer: BcPlayerPort = new BcPlayerAdapter();
  const musicPlayer: MusicPlayerPort = new MusicPlayerAdapter(audioProvider);

  registerBcPlayer(bandcampPlayer);
  registerMusicPlayer(musicPlayer);

  logDetectedBrowser();
  launchPlume();
})();
