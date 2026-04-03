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

  const titles = bcPlayer.getTrackRowTitles();
  const currentTitle = bcPlayer.getTrackTitle("album");
  const currentIndex = currentTitle !== null ? titles.indexOf(currentTitle) : -1;

  if (currentIndex === trackIndex) return;
  if (currentIndex === -1) {
    logger(CPL.WARN, getString("WARN__TRACKLIST__INDEX_OUT_OF_BOUNDS", [String(trackIndex)]));
    return;
  }

  const indexDelta = trackIndex - currentIndex;
  if (indexDelta > 0) {
    const nextBtn = bcPlayer.getNextTrackButton();
    for (let i = 0; i < indexDelta; i++) nextBtn?.click();
  } else {
    const prevBtn = bcPlayer.getPreviousTrackButton();
    for (let i = 0; i < -indexDelta; i++) prevBtn?.click();
  }

  logger(CPL.DEBUG, getString("DEBUG__TRACKLIST__NAVIGATED", [String(trackIndex + 1)]));
};
