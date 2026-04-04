import { BcPlayerPort } from "@/domain/ports/bc-player";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

export interface TrackQuantifiers {
  current: number;
  total: number;
}

export const getTrackQuantifiers = (trackName: string, bcPlayer: BcPlayerPort): TrackQuantifiers => {
  const trackRows = bcPlayer.getTrackRows();
  if (trackRows.length === 0) return { current: 0, total: 0 };

  const titles = bcPlayer.getTrackRowTitles();
  const currentTrackNumber = titles.findIndex((title) => title === trackName) + 1;

  logger(CPL.DEBUG, getString("DEBUG__TRACK__QUANTIFIERS", [String(currentTrackNumber), String(trackRows.length)]));
  return { current: currentTrackNumber, total: trackRows.length };
};
