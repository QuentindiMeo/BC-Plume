import { bandcampPlayer } from "../../infra/adapters";
import { CPL, logger } from "../../shared/logger";
import { getString } from "./i18n";

export interface TrackQuantifiers {
  current: number;
  total: number;
}

export const getTrackQuantifiers = (trackName: string): TrackQuantifiers => {
  const trackRowTitles = bandcampPlayer.getTrackRowTitles();
  if (trackRowTitles.length === 0) return { current: 0, total: 0 };

  const currentTrackNumber = trackRowTitles.indexOf(trackName) + 1;
  logger(CPL.DEBUG, getString("DEBUG__TRACK__QUANTIFIERS", [currentTrackNumber, trackRowTitles.length]));
  return { current: currentTrackNumber, total: trackRowTitles.length };
};
