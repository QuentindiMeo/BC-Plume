import { BcPlayerPort } from "../../domain/ports/bc-player";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";

export interface TrackQuantifiers {
  current: number;
  total: number;
}

export const getTrackQuantifiers = (trackName: string, bcPlayer: BcPlayerPort): TrackQuantifiers => {
  const trackRows = bcPlayer.getTrackRows();
  if (trackRows.length === 0) return { current: 0, total: 0 };

  const playableTitles = bcPlayer.getTrackRowTitles();
  const playableTitlesIt = playableTitles[Symbol.iterator]();
  const rowsMarked = trackRows.map((row) => {
    const isPlayable = row.classList.contains("linked");
    return { isPlayable, title: isPlayable ? playableTitlesIt.next().value : undefined };
  });
  const currentTrackNumber = rowsMarked.findIndex((row) => row.title === trackName) + 1;

  logger(CPL.DEBUG, getString("DEBUG__TRACK__QUANTIFIERS", [String(currentTrackNumber), String(trackRows.length)]));
  return { current: currentTrackNumber, total: trackRows.length };
};
