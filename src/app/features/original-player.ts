import { BC_ELEM_IDENTIFIERS, BC_PLAYER_SELECTORS } from "../../domain/bandcamp";
import { PLUME_ELEM_IDENTIFIERS } from "../../domain/plume";
import { CPL, logger } from "../../shared/logger";
import { getGuiInstance } from "../stores/GuiImpl";
import { getString } from "./i18n";

export const hideOriginalPlayerElements = (): void => {
  const bcAudioTable = document.querySelector(BC_ELEM_IDENTIFIERS.inlinePlayerTable) as HTMLTableElement;
  if (bcAudioTable) {
    bcAudioTable.style.display = "none";
    bcAudioTable.classList.add(PLUME_ELEM_IDENTIFIERS.bcElements.split("#")[1]);
  }

  logger(CPL.LOG, getString("LOG__ORIGINAL_PLAYER__HIDDEN"));
};

// for debugging
export const restoreOriginalPlayerElements = (): void => {
  const bcAudioTable = document.querySelector(PLUME_ELEM_IDENTIFIERS.bcElements) as HTMLTableElement;
  if (!bcAudioTable) return; // eliminate onInit function call

  bcAudioTable.style.display = "unset";
  bcAudioTable.classList.remove(PLUME_ELEM_IDENTIFIERS.bcElements.split("#")[1]);

  logger(CPL.LOG, getString("LOG__ORIGINAL_PLAYER__RESTORED"));
};

export const findOriginalPlayerContainer = (): HTMLDivElement | null => {
  let playerContainer = null;
  for (const selector of BC_PLAYER_SELECTORS) {
    playerContainer = document.querySelector(selector);
    if (playerContainer) break; // found the original player container!
  }

  if (!playerContainer) {
    const plumeUi = getGuiInstance();
    const plume = plumeUi.getState();
    logger(CPL.WARN, getString("WARN__PLAYER_CONTAINER_NOT_FOUND"));
    // Search near audio elements
    playerContainer = plume.audioElement.closest("div") || plume.audioElement.parentElement;
  }

  return playerContainer ? (playerContainer as HTMLDivElement) : null;
};
