import type { BcPlayerPort } from "@/domain/ports/bc-player";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

export const navigateToTrack = (trackIndex: number, bcPlayer: BcPlayerPort): void => {
  const rows = bcPlayer.getTrackRows();

  if (trackIndex < 0 || trackIndex >= rows.length) {
    logger(CPL.WARN, getString("WARN__TRACKLIST__INDEX_OUT_OF_BOUNDS", [String(trackIndex)]));
    return;
  }

  const row = rows[trackIndex];
  if (!row.classList.contains("linked")) {
    logger(CPL.WARN, getString("WARN__TRACKLIST__TRACK_UNPLAYABLE", [String(trackIndex + 1)]));
    return;
  }

  row.click();
  logger(CPL.DEBUG, getString("DEBUG__TRACKLIST__NAVIGATED", [String(trackIndex + 1)]));
};
