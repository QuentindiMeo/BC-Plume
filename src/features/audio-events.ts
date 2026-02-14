import { PLUME_CONSTANTS, PLUME_ELEM_IDENTIFIERS } from "../domain/plume";
import { getPlumeUiInstance } from "../infra/AppInstanceImpl";
import { getStoreInstance, STORE_ACTION_TYPES } from "../infra/AppStoreImpl";
import { getString } from "./i18n";
import { CPL, logger } from "./logger";
import type { CleanupCallback } from "./types";
import { updateProgressBar } from "./ui";

const { VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

export interface AudioEventCallbacks {
  updateTitleDisplay: () => void;
  updatePretextDisplay: () => void;
  updateTrackForwardBtnState: () => void;
}

export function setupAudioEventListeners(callbacks: AudioEventCallbacks): CleanupCallback {
  const store = getStoreInstance();
  const plumeUiInstance = getPlumeUiInstance();
  const plume = plumeUiInstance.getState();
  const { updateTitleDisplay, updatePretextDisplay, updateTrackForwardBtnState } = callbacks;

  const handleTimeUpdate = () => {
    updateProgressBar();
  };

  const handleLoadedMetadata = () => {
    updateProgressBar();
    updateTitleDisplay();
    updatePretextDisplay();
    updateTrackForwardBtnState();
  };

  const handleDurationChange = () => {
    updateProgressBar();
  };

  const handleLoadStart = () => {
    updateTitleDisplay();
    updatePretextDisplay();
    updateTrackForwardBtnState();
  };

  const handleVolumeChange = () => {
    if (!plume.volumeSlider) return;

    const currentVolume = plume.audioElement.volume;
    plume.volumeSlider.value = `${Math.round(currentVolume * VOLUME_SLIDER_GRANULARITY)}`;
    const valueDisplay = plume.volumeSlider.parentElement!.querySelector(
      PLUME_ELEM_IDENTIFIERS.volumeValue
    ) as HTMLSpanElement;
    if (valueDisplay) {
      valueDisplay.textContent = `${plume.volumeSlider.value}${getString("META__PERCENTAGE")}`;
    }

    const isMuted = currentVolume === 0;
    if (store.getState().isMuted !== isMuted) {
      store.dispatch({ type: STORE_ACTION_TYPES.SET_IS_MUTED, payload: isMuted });
    }
    store.dispatch({ type: STORE_ACTION_TYPES.SET_VOLUME, payload: currentVolume });
  };

  const handlePlay = () => {
    store.dispatch({ type: STORE_ACTION_TYPES.SET_IS_PLAYING, payload: true });
  };

  const handlePause = () => {
    store.dispatch({ type: STORE_ACTION_TYPES.SET_IS_PLAYING, payload: false });
  };

  plume.audioElement.addEventListener("timeupdate", handleTimeUpdate);
  plume.audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
  plume.audioElement.addEventListener("durationchange", handleDurationChange);
  plume.audioElement.addEventListener("loadstart", handleLoadStart);
  plume.audioElement.addEventListener("volumechange", handleVolumeChange);
  plume.audioElement.addEventListener("play", handlePlay);
  plume.audioElement.addEventListener("pause", handlePause);

  logger(CPL.INFO, getString("INFO__AUDIO_EVENT_LISTENERS__SET_UP"));

  return () => {
    plume.audioElement.removeEventListener("timeupdate", handleTimeUpdate);
    plume.audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
    plume.audioElement.removeEventListener("durationchange", handleDurationChange);
    plume.audioElement.removeEventListener("loadstart", handleLoadStart);
    plume.audioElement.removeEventListener("volumechange", handleVolumeChange);
    plume.audioElement.removeEventListener("play", handlePlay);
    plume.audioElement.removeEventListener("pause", handlePause);
  };
}
