import { BC_ELEM_IDENTIFIERS } from "../../../domain/bandcamp";
import { PLUME_CONSTANTS, PLUME_ELEM_IDENTIFIERS } from "../../../domain/plume";
import { CPL, logger } from "../../../shared/logger";
import { PLUME_SVG } from "../../../svg/icons";
import { getPlumeUiInstance } from "../../stores/AppInstanceImpl";
import { getStoreInstance, storeActions } from "../../stores/AppStoreImpl";
import { getString } from "../i18n";
import { seekAndPreservePause } from "../seeking";

const { TIME_BEFORE_RESTART } = PLUME_CONSTANTS;
const TIME_STEP_DURATION = 10; // seconds to skip forward/backward

export const handlePlayPause = (): void => {
  logger(CPL.DEBUG, getString("DEBUG__PLAY_PAUSE__CLICKED"));

  const store = getStoreInstance();

  // Dispatch to store only - subscription handles audio element state
  const isCurrentlyPlaying = store.getState().isPlaying;
  const shouldPlay = !isCurrentlyPlaying;
  store.dispatch(storeActions.setIsPlaying(shouldPlay));
};

export const handleTrackBackward = (): void => {
  const plumeUi = getPlumeUiInstance();
  const plume = plumeUi.getState();

  logger(CPL.DEBUG, getString("DEBUG__PREV_TRACK__CLICKED"));

  // If past TIME_BEFORE_RESTART, restart current track
  if (plume.audioElement.currentTime > TIME_BEFORE_RESTART) {
    plume.audioElement.currentTime = 0;
    logger(CPL.INFO, getString("DEBUG__PREV_TRACK__RESTARTED"));
    return;
  }

  // Otherwise, click BC's previous button
  const bcPrevBtn = document.querySelector(BC_ELEM_IDENTIFIERS.previousTrack) as HTMLButtonElement;
  if (!bcPrevBtn) {
    logger(CPL.WARN, getString("WARN__PREV_TRACK__NOT_FOUND"));
    return;
  }

  bcPrevBtn.click();
  logger(CPL.DEBUG, getString("DEBUG__PREV_TRACK__DISPATCHED"));
};

export const handleTrackForward = (): void => {
  logger(CPL.DEBUG, getString("DEBUG__NEXT_TRACK__CLICKED"));

  const bcNextBtn = document.querySelector(BC_ELEM_IDENTIFIERS.nextTrack) as HTMLButtonElement;
  if (!bcNextBtn) {
    logger(CPL.WARN, getString("WARN__NEXT_TRACK__NOT_FOUND"));
    return;
  }

  bcNextBtn.click();
  logger(CPL.DEBUG, getString("DEBUG__NEXT_TRACK__DISPATCHED"));
};

export const handleTimeBackward = (): void => {
  const store = getStoreInstance();
  const plumeUi = getPlumeUiInstance();
  const plume = plumeUi.getState();

  logger(CPL.DEBUG, getString("DEBUG__REWIND_TIME__CLICKED"));

  const newTime = Math.max(0, plume.audioElement.currentTime - TIME_STEP_DURATION);
  seekAndPreservePause(plume.audioElement, newTime);
  store.dispatch(storeActions.setCurrentTime(newTime));

  logger(CPL.DEBUG, getString("DEBUG__REWIND_TIME__DISPATCHED", [Math.round(newTime)]));
};

export const handleTimeForward = (): void => {
  const store = getStoreInstance();
  const plumeUi = getPlumeUiInstance();
  const plume = plumeUi.getState();

  logger(CPL.DEBUG, getString("DEBUG__FORWARD_TIME__CLICKED"));

  const newTime = Math.min(plume.audioElement.duration || 0, plume.audioElement.currentTime + TIME_STEP_DURATION);
  seekAndPreservePause(plume.audioElement, newTime);
  store.dispatch(storeActions.setCurrentTime(newTime));

  logger(CPL.DEBUG, getString("DEBUG__FORWARD_TIME__DISPATCHED", [Math.round(newTime)]));
};

export const createPlaybackControlPanel = (): HTMLDivElement => {
  const plume = getPlumeUiInstance().getState();
  const container = document.createElement("div");
  container.id = PLUME_ELEM_IDENTIFIERS.playbackControls.split("#")[1];

  const trackBackwardBtn = document.createElement("button");
  trackBackwardBtn.id = PLUME_ELEM_IDENTIFIERS.trackBwdBtn.split("#")[1];
  trackBackwardBtn.type = "button";
  trackBackwardBtn.innerHTML = PLUME_SVG.trackBackward;
  trackBackwardBtn.title = getString("LABEL__TRACK_BACKWARD");
  trackBackwardBtn.ariaLabel = getString("LABEL__TRACK_BACKWARD");
  trackBackwardBtn.addEventListener("click", handleTrackBackward);

  const timeBackwardBtn = document.createElement("button");
  timeBackwardBtn.id = PLUME_ELEM_IDENTIFIERS.timeBwdBtn.split("#")[1];
  timeBackwardBtn.type = "button";
  timeBackwardBtn.innerHTML = PLUME_SVG.timeBackward;
  timeBackwardBtn.title = getString("LABEL__TIME_BACKWARD");
  timeBackwardBtn.ariaLabel = getString("LABEL__TIME_BACKWARD");
  timeBackwardBtn.addEventListener("click", handleTimeBackward);

  const playPauseBtn = document.createElement("button");
  playPauseBtn.id = PLUME_ELEM_IDENTIFIERS.playPauseBtn.split("#")[1];
  playPauseBtn.type = "button";
  playPauseBtn.innerHTML = plume.audioElement.paused ? PLUME_SVG.playPlay : PLUME_SVG.playPause;
  playPauseBtn.title = getString("LABEL__PLAY_PAUSE");
  playPauseBtn.ariaLabel = getString("LABEL__PLAY_PAUSE");
  playPauseBtn.addEventListener("click", handlePlayPause);

  const timeForwardBtn = document.createElement("button");
  timeForwardBtn.id = PLUME_ELEM_IDENTIFIERS.timeFwdBtn.split("#")[1];
  timeForwardBtn.type = "button";
  timeForwardBtn.innerHTML = PLUME_SVG.timeForward;
  timeForwardBtn.title = getString("LABEL__TIME_FORWARD");
  timeForwardBtn.ariaLabel = getString("LABEL__TIME_FORWARD");
  timeForwardBtn.addEventListener("click", handleTimeForward);

  const trackForwardBtn = document.createElement("button");
  trackForwardBtn.id = PLUME_ELEM_IDENTIFIERS.trackFwdBtn.split("#")[1];
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

  return container;
};
