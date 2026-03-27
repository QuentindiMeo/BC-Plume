import { LOOP_MODE } from "../../domain/plume";
import type { IAppCore } from "../../domain/ports/app-core";
import type { BcPlayerPort } from "../../domain/ports/bc-player";
import type { MusicPlayerPort } from "../../domain/ports/music-player";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";

export const isLastTrackOfAlbumPlaying = (bcPlayer: BcPlayerPort): boolean => {
  const trackRowTitles = bcPlayer.getTrackRowTitles();
  if (trackRowTitles.length === 0) return false;

  const lastTrackTitle = trackRowTitles.at(-1);
  const currentTrackTitle = bcPlayer.getTrackTitle("album");
  if (!currentTrackTitle) return false;

  return lastTrackTitle === currentTrackTitle;
};

// Restarts the current track if past trackRestartThreshold seconds, otherwise goes to the previous track.
export const navigateTrackBackward = (appCore: IAppCore, player: MusicPlayerPort, bcPlayer: BcPlayerPort): void => {
  const trackRestartThreshold = appCore.getState().trackRestartThreshold;

  if (player.getCurrentTime() > trackRestartThreshold) {
    player.seekTo(0);
    logger(CPL.INFO, getString("DEBUG__TRACK__RESTARTED"));
    return;
  }

  const bcPrevBtn = bcPlayer.getPreviousTrackButton();
  if (!bcPrevBtn) {
    logger(CPL.WARN, getString("WARN__PREV_TRACK__NOT_FOUND"));
    return;
  }

  bcPrevBtn.click();
  logger(CPL.DEBUG, getString("DEBUG__PREV_TRACK__DISPATCHED"));
};

// When loopMode is COLLECTION and the next track button is absent (last track),
// wrap around to the first track by clicking the first track row in the album table.
export const navigateTrackForward = (appCore: IAppCore, musicPlayer: MusicPlayerPort, bcPlayer: BcPlayerPort): void => {
  const bcNextBtn = bcPlayer.getNextTrackButton();
  const { pageType, loopMode } = appCore.getState();
  const currentIsLastTrackOfAlbum = isLastTrackOfAlbumPlaying(bcPlayer);

  if (currentIsLastTrackOfAlbum && loopMode !== LOOP_MODE.NONE) {
    // cycle back to first track when on last track of collection
    const bcPrevBtn = bcPlayer.getPreviousTrackButton();
    const tracks = bcPlayer.getTrackRows();
    for (const _ of tracks) bcPrevBtn?.click();
    logger(CPL.DEBUG, getString("DEBUG__NEXT_TRACK__DISPATCHED"));
  } else if (pageType === "track" && loopMode !== LOOP_MODE.NONE) {
    // On track pages in TRACK loop mode, treat "next" as restarting the current track.
    musicPlayer.seekTo(0);
    logger(CPL.INFO, getString("DEBUG__NEXT_TRACK__RESTARTED"));
  } else if (bcNextBtn) {
    bcNextBtn.click();
    logger(CPL.DEBUG, getString("DEBUG__NEXT_TRACK__DISPATCHED"));
  } else {
    logger(CPL.WARN, getString("WARN__NEXT_TRACK__NOT_FOUND"));
  }
};
