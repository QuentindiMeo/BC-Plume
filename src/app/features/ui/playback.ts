import { guiActions } from "../../../domain/ports/plume-ui";
import { PLUME_ELEM_SELECTORS } from "../../../infra/elements/plume";
import { getString } from "../../../shared/i18n";
import { CPL, logger } from "../../../shared/logger";
import { setSvgContent } from "../../../shared/svg";
import { PLUME_SVG } from "../../../svg/icons";
import { getBcPlayerInstance, getMusicPlayerInstance } from "../../stores/adapters";
import { getAppCoreInstance } from "../../stores/AppCoreImpl";
import { getGuiInstance } from "../../stores/GuiImpl";
import {
  navigateTrackBackward,
  navigateTrackForward,
  seekBackward,
  seekForward,
  togglePlayback,
} from "../../use-cases";
import { applyLoopBtnState, handleLoopCycle } from "./loop";

export const handlePlayPause = (): void => {
  logger(CPL.DEBUG, getString("DEBUG__PLAY_PAUSE__CLICKED"));
  togglePlayback(getAppCoreInstance());
};

export const handleTrackBackward = (): void => {
  logger(CPL.DEBUG, getString("DEBUG__PREV_TRACK__CLICKED"));

  const musicPlayer = getMusicPlayerInstance();
  const bcPlayer = getBcPlayerInstance();
  navigateTrackBackward(musicPlayer, bcPlayer);
};

export const handleTrackForward = (): void => {
  logger(CPL.DEBUG, getString("DEBUG__NEXT_TRACK__CLICKED"));

  const bcPlayer = getBcPlayerInstance();
  const appCore = getAppCoreInstance();
  const loopMode = appCore.getState().loopMode;
  navigateTrackForward(bcPlayer, loopMode);
};

export const handleTimeBackward = (): void => {
  logger(CPL.DEBUG, getString("DEBUG__REWIND_TIME__CLICKED"));

  const musicPlayer = getMusicPlayerInstance();
  seekBackward(getAppCoreInstance(), musicPlayer);
};

export const handleTimeForward = (): void => {
  logger(CPL.DEBUG, getString("DEBUG__FORWARD_TIME__CLICKED"));

  const musicPlayer = getMusicPlayerInstance();
  seekForward(getAppCoreInstance(), musicPlayer);
};

export const createPlaybackControlPanel = (): HTMLDivElement => {
  const appCore = getAppCoreInstance();
  const plumeUi = getGuiInstance();
  const container = document.createElement("div");
  container.id = PLUME_ELEM_SELECTORS.playbackControls.split("#")[1];

  const trackBackwardBtn = document.createElement("button");
  trackBackwardBtn.id = PLUME_ELEM_SELECTORS.trackBwdBtn.split("#")[1];
  trackBackwardBtn.type = "button";
  setSvgContent(trackBackwardBtn, PLUME_SVG.trackBackward);
  trackBackwardBtn.title = getString("LABEL__TRACK_BACKWARD");
  trackBackwardBtn.ariaLabel = getString("LABEL__TRACK_BACKWARD");
  trackBackwardBtn.addEventListener("click", handleTrackBackward);

  const timeBackwardBtn = document.createElement("button");
  timeBackwardBtn.id = PLUME_ELEM_SELECTORS.timeBwdBtn.split("#")[1];
  timeBackwardBtn.type = "button";
  setSvgContent(timeBackwardBtn, PLUME_SVG.timeBackward);
  timeBackwardBtn.title = getString("LABEL__TIME_BACKWARD");
  timeBackwardBtn.ariaLabel = getString("LABEL__TIME_BACKWARD");
  timeBackwardBtn.addEventListener("click", handleTimeBackward);

  const playPauseBtn = document.createElement("button");
  playPauseBtn.id = PLUME_ELEM_SELECTORS.playPauseBtn.split("#")[1];
  playPauseBtn.type = "button";
  setSvgContent(playPauseBtn, getMusicPlayerInstance().isPaused() ? PLUME_SVG.playPlay : PLUME_SVG.playPause);
  playPauseBtn.title = getString("LABEL__PLAY_PAUSE");
  playPauseBtn.ariaLabel = getString("LABEL__PLAY_PAUSE");
  playPauseBtn.addEventListener("click", handlePlayPause);

  const timeForwardBtn = document.createElement("button");
  timeForwardBtn.id = PLUME_ELEM_SELECTORS.timeFwdBtn.split("#")[1];
  timeForwardBtn.type = "button";
  setSvgContent(timeForwardBtn, PLUME_SVG.timeForward);
  timeForwardBtn.title = getString("LABEL__TIME_FORWARD");
  timeForwardBtn.ariaLabel = getString("LABEL__TIME_FORWARD");
  timeForwardBtn.addEventListener("click", handleTimeForward);

  const trackForwardBtn = document.createElement("button");
  trackForwardBtn.id = PLUME_ELEM_SELECTORS.trackFwdBtn.split("#")[1];
  trackForwardBtn.type = "button";
  setSvgContent(trackForwardBtn, PLUME_SVG.trackForward);
  trackForwardBtn.title = getString("LABEL__TRACK_FORWARD");
  trackForwardBtn.ariaLabel = getString("LABEL__TRACK_FORWARD");
  trackForwardBtn.addEventListener("click", handleTrackForward);

  const loopBtn = document.createElement("button");
  loopBtn.id = PLUME_ELEM_SELECTORS.loopBtn.split("#")[1];
  loopBtn.type = "button";
  setSvgContent(loopBtn, PLUME_SVG.loopNone);
  loopBtn.title = getString("ARIA__LOOP__OFF");
  loopBtn.ariaLabel = getString("ARIA__LOOP__OFF");
  loopBtn.ariaPressed = "false";
  loopBtn.addEventListener("click", handleLoopCycle);

  container.appendChild(trackBackwardBtn);
  container.appendChild(timeBackwardBtn);
  container.appendChild(playPauseBtn);
  container.appendChild(timeForwardBtn);
  container.appendChild(trackForwardBtn);
  container.appendChild(loopBtn);

  // Seed the store arrays with the main-panel buttons; fullscreen.ts appends its clones
  plumeUi.dispatch(guiActions.setPlayPauseBtns([playPauseBtn]));
  plumeUi.dispatch(guiActions.setTrackFwdBtns([trackForwardBtn]));
  plumeUi.dispatch(guiActions.setLoopBtns([loopBtn]));

  // Apply persisted loop state immediately so button reflects loaded state
  applyLoopBtnState(loopBtn, appCore.getState().loopMode);

  return container;
};
