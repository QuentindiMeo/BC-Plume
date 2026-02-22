import { bandcampPlayer } from "../../infra/adapters";
import { PLUME_ELEM_SELECTORS } from "../../infra/elements/plume";
import { CPL, logger } from "../../shared/logger";
import { getGuiInstance } from "../stores/GuiImpl";
import { getString } from "./i18n";

export const hideOriginalPlayerElements = (): void => {
  const bcAudioTable = bandcampPlayer.getInlinePlayerTable();
  if (bcAudioTable) {
    bcAudioTable.style.display = "none";
    bcAudioTable.classList.add(PLUME_ELEM_SELECTORS.bcElements.split("#")[1]);
  }

  logger(CPL.LOG, getString("LOG__ORIGINAL_PLAYER__HIDDEN"));
};

// for debugging
export const restoreOriginalPlayerElements = (): void => {
  const bcAudioTable = document.querySelector(PLUME_ELEM_SELECTORS.bcElements) as HTMLTableElement;
  if (!bcAudioTable) return; // eliminate onInit function call

  bcAudioTable.style.display = "unset";
  bcAudioTable.classList.remove(PLUME_ELEM_SELECTORS.bcElements.split("#")[1]);

  logger(CPL.LOG, getString("LOG__ORIGINAL_PLAYER__RESTORED"));
};

export const findOriginalPlayerContainer = (): HTMLDivElement | null => {
  const playerParent = bandcampPlayer.getPlayerParent();
  if (playerParent) return playerParent as HTMLDivElement;

  const plumeUi = getGuiInstance();
  const plume = plumeUi.getState();
  logger(CPL.WARN, getString("WARN__PLAYER_CONTAINER_NOT_FOUND"));
  // Fallback: search near the audio element when no known player container selector matches
  const fallback = plume.audioElement.closest("div") || plume.audioElement.parentElement;
  return fallback ? (fallback as HTMLDivElement) : null;
};
