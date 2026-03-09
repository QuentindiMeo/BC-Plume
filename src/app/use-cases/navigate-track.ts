import type { LoopModeType } from "../../domain/plume";
import { LOOP_MODE, PLUME_CONSTANTS } from "../../domain/plume";
import type { BcPlayerPort } from "../../domain/ports/bc-player";
import type { MusicPlayerPort } from "../../domain/ports/music-player";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { getMusicPlayerInstance } from "../stores/adapters";
import { getAppCoreInstance } from "../stores/AppCoreImpl";

export const isLastTrackOfAlbumPlaying = (bcPlayer: BcPlayerPort): boolean => {
  const trackRowTitles = bcPlayer.getTrackRowTitles();
  if (trackRowTitles.length === 0) return false;

  const lastTrackTitle = trackRowTitles.at(-1);
  const currentTrackTitle = bcPlayer.getTrackTitle("album");
  if (!currentTrackTitle) return false;

  return lastTrackTitle === currentTrackTitle;
};

const { TIME_BEFORE_RESTART } = PLUME_CONSTANTS;

// Restarts the current track if past TIME_BEFORE_RESTART seconds, otherwise goes to the previous track.
// navigateTrackForward needs no player arg because it only delegates to the BC button with no seek fallback.
export const navigateTrackBackward = (player: MusicPlayerPort, bcPlayer: BcPlayerPort): void => {
  if (player.getCurrentTime() > TIME_BEFORE_RESTART) {
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
export const navigateTrackForward = (bcPlayer: BcPlayerPort, loopMode: LoopModeType): void => {
  const bcNextBtn = bcPlayer.getNextTrackButton();
  const pageType = getAppCoreInstance().getState().pageType;
  const currentIsLastTrackOfAlbum = isLastTrackOfAlbumPlaying(bcPlayer);

  if (currentIsLastTrackOfAlbum && loopMode !== LOOP_MODE.NONE) {
    // cycle back to first track when on last track of collection
    const bcPrevBtn = bcPlayer.getPreviousTrackButton();
    const tracks = bcPlayer.getTrackRows();
    for (const _ of tracks) bcPrevBtn?.click();
    logger(CPL.DEBUG, getString("DEBUG__NEXT_TRACK__DISPATCHED"));
  } else if (pageType === "track" && loopMode !== LOOP_MODE.NONE) {
    const musicPlayer = getMusicPlayerInstance();
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
