import { PLUME_CONSTANTS, PLUME_ELEM_IDENTIFIERS } from "../domain/plume";
import { getPlumeUiInstance, PLUME_ACTIONS } from "../infra/AppInstanceImpl";
import { getStoreInstance, STORE_ACTIONS } from "../infra/AppStoreImpl";
import { getString } from "./i18n";
import { CPL, logger } from "./logger";
import { isPlaybackUpdatingFromSubscription } from "./store-subscriptions";
import type { CleanupCallback } from "./types";
import { syncProgressToStore } from "./ui";

const { VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

export interface AudioEventCallbacks {
  updateTitleDisplay: () => void;
  updatePretextDisplay: () => void;
  updateTrackForwardBtnState: () => void;
}

export const setupAudioEventListeners = (callbacks: AudioEventCallbacks): CleanupCallback => {
  const store = getStoreInstance();
  const plumeUi = getPlumeUiInstance();
  const plume = plumeUi.getState();
  const { updateTitleDisplay, updatePretextDisplay, updateTrackForwardBtnState } = callbacks;

  const handleTimeUpdate = () => {
    syncProgressToStore();
  };

  const handleLoadedMetadata = () => {
    syncProgressToStore();
    updateTitleDisplay();
    updatePretextDisplay();
    updateTrackForwardBtnState();
  };

  const handleDurationChange = () => {
    syncProgressToStore();
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
    plumeUi.dispatch({ type: PLUME_ACTIONS.SET_VOLUME_SLIDER, payload: plume.volumeSlider });

    const valueDisplay = plume.volumeSlider.parentElement!.querySelector(
      PLUME_ELEM_IDENTIFIERS.volumeValue
    ) as HTMLSpanElement;
    if (valueDisplay) {
      valueDisplay.textContent = `${plume.volumeSlider.value}${getString("META__PERCENTAGE")}`;
    }

    const currentIsMuted = store.getState().isMuted;
    const newIsMuted = currentVolume === 0;
    if (currentIsMuted !== newIsMuted) {
      store.dispatch({ type: STORE_ACTIONS.SET_IS_MUTED, payload: newIsMuted });
    }
    store.dispatch({ type: STORE_ACTIONS.SET_VOLUME, payload: currentVolume });
  };

  const handlePlayPause = () => {
    if (isPlaybackUpdatingFromSubscription()) return;

    const plumeUi = getPlumeUiInstance();
    const plume = plumeUi.getState();

    const isPlaying = !plume.audioElement.paused;
    store.dispatch({ type: STORE_ACTIONS.SET_IS_PLAYING, payload: isPlaying });
  };

  plume.audioElement.addEventListener("timeupdate", handleTimeUpdate);
  plume.audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
  plume.audioElement.addEventListener("durationchange", handleDurationChange);
  plume.audioElement.addEventListener("loadstart", handleLoadStart);
  plume.audioElement.addEventListener("volumechange", handleVolumeChange);
  plume.audioElement.addEventListener("play", handlePlayPause);
  plume.audioElement.addEventListener("pause", handlePlayPause);

  logger(CPL.INFO, getString("INFO__AUDIO_EVENT_LISTENERS__SET_UP"));

  return () => {
    plume.audioElement.removeEventListener("timeupdate", handleTimeUpdate);
    plume.audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
    plume.audioElement.removeEventListener("durationchange", handleDurationChange);
    plume.audioElement.removeEventListener("loadstart", handleLoadStart);
    plume.audioElement.removeEventListener("volumechange", handleVolumeChange);
    plume.audioElement.removeEventListener("play", handlePlayPause);
    plume.audioElement.removeEventListener("pause", handlePlayPause);
  };
};
