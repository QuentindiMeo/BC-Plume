import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { getBcPlayerInstance } from "../stores/adapters";

export interface TrackQuantifiers {
  current: number;
  total: number;
}

export const getTrackQuantifiers = (trackName: string): TrackQuantifiers => {
  const bcPlayer = getBcPlayerInstance();
  const trackRowTitles = bcPlayer.getTrackRowTitles();
  if (trackRowTitles.length === 0) return { current: 0, total: 0 };

  const currentTrackNumber = trackRowTitles.indexOf(trackName) + 1;
  logger(
    CPL.DEBUG,
    getString("DEBUG__TRACK__QUANTIFIERS", [String(currentTrackNumber), String(trackRowTitles.length)])
  );
  return { current: currentTrackNumber, total: trackRowTitles.length };
};
