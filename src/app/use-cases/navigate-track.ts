import { PLUME_CONSTANTS } from "../../domain/plume";
import type { BcPlayerPort } from "../../domain/ports/bc-player";
import type { MusicPlayerPort } from "../../domain/ports/music-player";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";

const { TIME_BEFORE_RESTART } = PLUME_CONSTANTS;

// Restarts the current track if past TIME_BEFORE_RESTART seconds, otherwise goes to the previous track.
// navigateTrackForward needs no player arg because it only delegates to the BC button with no seek fallback.
export const navigateTrackBackward = (player: MusicPlayerPort, bcPlayer: BcPlayerPort): void => {
  if (player.getCurrentTime() > TIME_BEFORE_RESTART) {
    player.seekTo(0);
    logger(CPL.INFO, getString("DEBUG__PREV_TRACK__RESTARTED"));
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

export const navigateTrackForward = (bcPlayer: BcPlayerPort): void => {
  const bcNextBtn = bcPlayer.getNextTrackButton();
  if (!bcNextBtn) {
    logger(CPL.WARN, getString("WARN__NEXT_TRACK__NOT_FOUND"));
    return;
  }

  bcNextBtn.click();
  logger(CPL.DEBUG, getString("DEBUG__NEXT_TRACK__DISPATCHED"));
};
