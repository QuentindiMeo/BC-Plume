import { BC_ELEM_SELECTORS } from "../../infra/elements/bandcamp";
import { CPL, logger } from "../../shared/logger";
import { getString } from "./i18n";

export interface TrackQuantifiers {
  current: number;
  total: number;
}

export const getTrackQuantifiers = (trackName: string): TrackQuantifiers => {
  const trackTable = document.querySelector(BC_ELEM_SELECTORS.trackList) as HTMLTableElement;
  if (!trackTable) return { current: 0, total: 0 };

  const trackRows = trackTable.querySelectorAll(BC_ELEM_SELECTORS.trackRow);
  if (trackRows.length === 0) return { current: 0, total: 0 };

  const trackRowTitles = Array.from(trackTable.querySelectorAll(BC_ELEM_SELECTORS.trackTitle));
  const currentTrackNumber = trackRowTitles.findIndex((el) => el.textContent === trackName) + 1;
  logger(CPL.DEBUG, getString("DEBUG__TRACK__QUANTIFIERS", [currentTrackNumber, trackRows.length]));
  return { current: currentTrackNumber, total: trackRows.length };
};
