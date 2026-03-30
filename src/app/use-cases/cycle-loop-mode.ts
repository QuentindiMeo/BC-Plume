import { LOOP_MODE } from "@/domain/plume";
import { coreActions, IAppCore } from "@/domain/ports/app-core";
import type { MusicPlayerPort } from "@/domain/ports/music-player";

// Advances loopMode through NONE → COLLECTION → TRACK → NONE.
// Sets audio.loop=true only for TRACK mode; collection-loop is handled by the ended-event handler.
export const cycleLoopMode = (appCore: IAppCore, musicPlayer: MusicPlayerPort): void => {
  appCore.dispatch(coreActions.cycleLoopMode());

  const newMode = appCore.getState().loopMode;
  musicPlayer.setLoop(newMode === LOOP_MODE.TRACK);
};
