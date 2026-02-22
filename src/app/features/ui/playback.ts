import { PLUME_CONSTANTS } from "../../../domain/plume";
import { bandcampPlayer, musicPlayer } from "../../../infra/adapters";
import { PLUME_ELEM_SELECTORS } from "../../../infra/elements/plume";
import { CPL, logger } from "../../../shared/logger";
import { PLUME_SVG } from "../../../svg/icons";
import { coreActions, getAppCoreInstance } from "../../stores/AppCoreImpl";
import { getGuiInstance, guiActions } from "../../stores/GuiImpl";
import { getString } from "../i18n";

const { TIME_BEFORE_RESTART } = PLUME_CONSTANTS;
const TIME_STEP_DURATION = 10; // seconds to skip forward/backward

export const handlePlayPause = (): void => {
  logger(CPL.DEBUG, getString("DEBUG__PLAY_PAUSE__CLICKED"));

  const appCore = getAppCoreInstance();

  // Dispatch to appCore only - subscription handles audio element state
  const isCurrentlyPlaying = appCore.getState().isPlaying;
  const shouldPlay = !isCurrentlyPlaying;
  appCore.dispatch(coreActions.setIsPlaying(shouldPlay));
};

export const handleTrackBackward = (): void => {
  const plumeUi = getGuiInstance();
  const plume = plumeUi.getState();

  logger(CPL.DEBUG, getString("DEBUG__PREV_TRACK__CLICKED"));

  // If past TIME_BEFORE_RESTART, restart current track
  if (musicPlayer.getCurrentTime() > TIME_BEFORE_RESTART) {
    musicPlayer.seekTo(0);
    logger(CPL.INFO, getString("DEBUG__PREV_TRACK__RESTARTED"));
    return;
  }

  // Otherwise, click BC's previous button
  const bcPrevBtn = bandcampPlayer.getPreviousTrackButton();
  if (!bcPrevBtn) {
    logger(CPL.WARN, getString("WARN__PREV_TRACK__NOT_FOUND"));
    return;
  }

  bcPrevBtn.click();
  logger(CPL.DEBUG, getString("DEBUG__PREV_TRACK__DISPATCHED"));
};

export const handleTrackForward = (): void => {
  logger(CPL.DEBUG, getString("DEBUG__NEXT_TRACK__CLICKED"));

  const bcNextBtn = bandcampPlayer.getNextTrackButton();
  if (!bcNextBtn) {
    logger(CPL.WARN, getString("WARN__NEXT_TRACK__NOT_FOUND"));
    return;
  }

  bcNextBtn.click();
  logger(CPL.DEBUG, getString("DEBUG__NEXT_TRACK__DISPATCHED"));
};

export const handleTimeBackward = (): void => {
  const appCore = getAppCoreInstance();
  const plumeUi = getGuiInstance();
  const plume = plumeUi.getState();

  logger(CPL.DEBUG, getString("DEBUG__REWIND_TIME__CLICKED"));

  const newTime = Math.max(0, musicPlayer.getCurrentTime() - TIME_STEP_DURATION);
  musicPlayer.seekAndPreservePause(newTime);
  appCore.dispatch(coreActions.setCurrentTime(newTime));

  logger(CPL.DEBUG, getString("DEBUG__REWIND_TIME__DISPATCHED", [Math.round(newTime)]));
};

export const handleTimeForward = (): void => {
  const appCore = getAppCoreInstance();
  const plumeUi = getGuiInstance();
  const plume = plumeUi.getState();

  logger(CPL.DEBUG, getString("DEBUG__FORWARD_TIME__CLICKED"));

  const newTime = Math.min(musicPlayer.getDuration() || 0, musicPlayer.getCurrentTime() + TIME_STEP_DURATION);
  musicPlayer.seekAndPreservePause(newTime);
  appCore.dispatch(coreActions.setCurrentTime(newTime));

  logger(CPL.DEBUG, getString("DEBUG__FORWARD_TIME__DISPATCHED", [Math.round(newTime)]));
};

export const createPlaybackControlPanel = (): HTMLDivElement => {
  const plumeUi = getGuiInstance();
  const plume = plumeUi.getState();
  const container = document.createElement("div");
  container.id = PLUME_ELEM_SELECTORS.playbackControls.split("#")[1];

  const trackBackwardBtn = document.createElement("button");
  trackBackwardBtn.id = PLUME_ELEM_SELECTORS.trackBwdBtn.split("#")[1];
  trackBackwardBtn.type = "button";
  trackBackwardBtn.innerHTML = PLUME_SVG.trackBackward;
  trackBackwardBtn.title = getString("LABEL__TRACK_BACKWARD");
  trackBackwardBtn.ariaLabel = getString("LABEL__TRACK_BACKWARD");
  trackBackwardBtn.addEventListener("click", handleTrackBackward);

  const timeBackwardBtn = document.createElement("button");
  timeBackwardBtn.id = PLUME_ELEM_SELECTORS.timeBwdBtn.split("#")[1];
  timeBackwardBtn.type = "button";
  timeBackwardBtn.innerHTML = PLUME_SVG.timeBackward;
  timeBackwardBtn.title = getString("LABEL__TIME_BACKWARD");
  timeBackwardBtn.ariaLabel = getString("LABEL__TIME_BACKWARD");
  timeBackwardBtn.addEventListener("click", handleTimeBackward);

  const playPauseBtn = document.createElement("button");
  playPauseBtn.id = PLUME_ELEM_SELECTORS.playPauseBtn.split("#")[1];
  playPauseBtn.type = "button";
  playPauseBtn.innerHTML = musicPlayer.isPaused() ? PLUME_SVG.playPlay : PLUME_SVG.playPause;
  playPauseBtn.title = getString("LABEL__PLAY_PAUSE");
  playPauseBtn.ariaLabel = getString("LABEL__PLAY_PAUSE");
  playPauseBtn.addEventListener("click", handlePlayPause);

  const timeForwardBtn = document.createElement("button");
  timeForwardBtn.id = PLUME_ELEM_SELECTORS.timeFwdBtn.split("#")[1];
  timeForwardBtn.type = "button";
  timeForwardBtn.innerHTML = PLUME_SVG.timeForward;
  timeForwardBtn.title = getString("LABEL__TIME_FORWARD");
  timeForwardBtn.ariaLabel = getString("LABEL__TIME_FORWARD");
  timeForwardBtn.addEventListener("click", handleTimeForward);

  const trackForwardBtn = document.createElement("button");
  trackForwardBtn.id = PLUME_ELEM_SELECTORS.trackFwdBtn.split("#")[1];
  trackForwardBtn.type = "button";
  trackForwardBtn.innerHTML = PLUME_SVG.trackForward;
  trackForwardBtn.title = getString("LABEL__TRACK_FORWARD");
  trackForwardBtn.ariaLabel = getString("LABEL__TRACK_FORWARD");
  trackForwardBtn.addEventListener("click", handleTrackForward);

  container.appendChild(trackBackwardBtn);
  container.appendChild(timeBackwardBtn);
  container.appendChild(playPauseBtn);
  container.appendChild(timeForwardBtn);
  container.appendChild(trackForwardBtn);

  // Seed the store arrays with the main-panel buttons; fullscreen.ts appends its clones
  plumeUi.dispatch(guiActions.setPlayPauseBtns([playPauseBtn]));
  plumeUi.dispatch(guiActions.setTrackFwdBtns([trackForwardBtn]));

  return container;
};
