import { launchPlume } from "./app/features/lifecycle";
import { registerBcPlayer, registerMessageReceiver, registerMusicPlayer } from "./app/stores/adapters";
import { getGuiInstance } from "./app/stores/GuiImpl";
import type { BcPlayerPort } from "./domain/ports/bc-player";
import type { MusicPlayerPort } from "./domain/ports/music-player";
import { BcPlayerAdapter, GuiAudioProvider, MusicPlayerAdapter, RuntimeMessageReceiver } from "./infra/adapters";
import { logDetectedBrowser } from "./shared/i18n";

(() => {
  "use strict";

  const audioProvider = new GuiAudioProvider(getGuiInstance);
  const bandcampPlayer = new BcPlayerAdapter();
  const musicPlayer = new MusicPlayerAdapter(audioProvider);
  const messageReceiver = new RuntimeMessageReceiver();

  registerBcPlayer(bandcampPlayer satisfies BcPlayerPort);
  registerMusicPlayer(musicPlayer satisfies MusicPlayerPort);
  registerMessageReceiver(messageReceiver);

  logDetectedBrowser();
  launchPlume();
})();
