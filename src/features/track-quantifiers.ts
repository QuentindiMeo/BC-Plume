import { BC_ELEM_IDENTIFIERS } from "../domain/bandcamp";
import { getString } from "./i18n";
import { CPL, logger } from "./logger";

export interface TrackQuantifiers {
  current: number;
  total: number;
}

export const getTrackQuantifiers = (trackName: string): TrackQuantifiers => {
  const trackTable = document.querySelector(BC_ELEM_IDENTIFIERS.trackList) as HTMLTableElement;
  if (!trackTable) return { current: 0, total: 0 };

  const trackRows = trackTable.querySelectorAll(BC_ELEM_IDENTIFIERS.trackRow);
  if (trackRows.length === 0) return { current: 0, total: 0 };

  const trackRowTitles = Array.from(trackTable.querySelectorAll(BC_ELEM_IDENTIFIERS.trackTitle));
  const currentTrackNumber = trackRowTitles.findIndex((el) => el.textContent === trackName) + 1;
  logger(CPL.DEBUG, getString("DEBUG__TRACK__QUANTIFIERS", [currentTrackNumber, trackRows.length]));
  return { current: currentTrackNumber, total: trackRows.length };
};
