import { LOOP_MODE, LoopModeType } from "../../../domain/plume";
import { getString } from "../../../shared/i18n";
import { CPL, logger } from "../../../shared/logger";
import { setSvgContent } from "../../../shared/svg";
import { PLUME_SVG } from "../../../svg/icons";
import { getMusicPlayerInstance } from "../../stores/adapters";
import { getAppCoreInstance } from "../../stores/AppCoreImpl";
import { getGuiInstance } from "../../stores/GuiImpl";
import { cycleLoopMode } from "../../use-cases/cycle-loop-mode";

export const applyLoopBtnState = (btn: HTMLButtonElement, loopMode: LoopModeType): void => {
  const appCore = getAppCoreInstance();
  const isAlbumPage = appCore.getState().pageType === "album";
  switch (loopMode) {
    case LOOP_MODE.NONE:
      const btnStringNone = getString("ARIA__LOOP__OFF");
      setSvgContent(btn, PLUME_SVG.loopNone);
      btn.ariaPressed = "false";
      btn.ariaLabel = btnStringNone;
      btn.title = btnStringNone;
      break;
    case LOOP_MODE.COLLECTION: {
      const btnStringCollection = isAlbumPage
        ? getString("ARIA__LOOP__COLLECTION_ALBUM")
        : getString("ARIA__LOOP__COLLECTION_TRACK");
      setSvgContent(btn, PLUME_SVG.loopCollection);
      btn.ariaPressed = "true";
      btn.ariaLabel = btnStringCollection;
      btn.title = btnStringCollection;
      break;
    }
    case LOOP_MODE.TRACK:
      const btnStringTrack = getString("ARIA__LOOP__ONE_TRACK");
      setSvgContent(btn, PLUME_SVG.loopTrack);
      btn.ariaPressed = "true";
      btn.ariaLabel = btnStringTrack;
      btn.title = btnStringTrack;
      break;
  }
};

export const syncLoopBtn = (loopMode: LoopModeType): void => {
  const loopBtns = getGuiInstance().getState().loopBtns;
  loopBtns.forEach((btn) => applyLoopBtnState(btn, loopMode));
};

export const handleLoopCycle = (): void => {
  logger(CPL.DEBUG, getString("DEBUG__LOOP__CYCLED"));
  cycleLoopMode(getAppCoreInstance(), getMusicPlayerInstance());
};
