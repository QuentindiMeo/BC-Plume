import { guiActions } from "../../domain/ports/plume-ui";
import { PLUME_ELEM_SELECTORS } from "../../infra/elements/plume";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { getBcPlayerInstance } from "../stores/adapters";
import { getGuiInstance } from "../stores/GuiImpl";

export const hideOriginalPlayerElements = (): void => {
  const plumeUi = getGuiInstance();
  const bcPlayer = getBcPlayerInstance();
  const bcAudioTable = bcPlayer.getInlinePlayerTable();
  if (!bcAudioTable) {
    logger(CPL.LOG, getString("LOG__ORIGINAL_PLAYER__HIDDEN"));
    return;
  }

  bcAudioTable.style.display = "none";
  bcAudioTable.classList.add(PLUME_ELEM_SELECTORS.bcElements.split("#")[1]);
  plumeUi.dispatch(guiActions.setHiddenBcTable(bcAudioTable));
};

// for debugging
export const restoreOriginalPlayerElements = (): void => {
  const plumeUi = getGuiInstance();
  const bcAudioTable = plumeUi.getState().hiddenBcTable;
  if (!bcAudioTable) return; // eliminate onInit function call

  bcAudioTable.style.display = "unset";
  bcAudioTable.classList.remove(PLUME_ELEM_SELECTORS.bcElements.split("#")[1]);
  plumeUi.dispatch(guiActions.setHiddenBcTable(null));

  logger(CPL.LOG, getString("LOG__ORIGINAL_PLAYER__RESTORED"));
};

export const findOriginalPlayerContainer = (): HTMLDivElement | null => {
  const bcPlayer = getBcPlayerInstance();
  const playerParent = bcPlayer.getPlayerParent();
  if (playerParent) return playerParent as HTMLDivElement;

  const plume = getGuiInstance().getState();
  logger(CPL.WARN, getString("WARN__PLAYER_CONTAINER_NOT_FOUND"));
  // Fallback: search near the audio element when no known player container selector matches
  const fallback = plume.audioElement.closest("div") || plume.audioElement.parentElement;
  return fallback ? (fallback as HTMLDivElement) : null;
};
