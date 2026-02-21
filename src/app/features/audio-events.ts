import { PLUME_CONSTANTS, PLUME_ELEM_IDENTIFIERS } from "../../domain/plume";
import { CPL, logger } from "../../shared/logger";
import { coreActions, getAppCoreInstance } from "../stores/AppCoreImpl";
import { getGuiInstance, guiActions } from "../stores/GuiImpl";
import { getString } from "./i18n";
import type { CleanupCallback } from "./types";
import { syncProgressToStore } from "./ui";

const { VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

export interface AudioEventCallbacks {
  updateTitleDisplay: () => void;
  updatePretextDisplay: () => void;
  updateTrackForwardBtnState: () => void;
}

export const setupAudioEventListeners = (callbacks: AudioEventCallbacks): CleanupCallback => {
  const appCore = getAppCoreInstance();
  const plumeUi = getGuiInstance();
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
    plumeUi.dispatch(guiActions.setVolumeSlider(plume.volumeSlider));

    const valueDisplay = plume.volumeSlider.parentElement!.querySelector(
      PLUME_ELEM_IDENTIFIERS.volumeValue
    ) as HTMLSpanElement;
    if (valueDisplay) {
      valueDisplay.textContent = `${plume.volumeSlider.value}${getString("META__PERCENTAGE")}`;
    }

    const currentIsMuted = appCore.getState().isMuted;
    const newIsMuted = currentVolume === 0;
    if (currentIsMuted !== newIsMuted) {
      appCore.dispatch(coreActions.setIsMuted(newIsMuted));
    }
    appCore.dispatch(coreActions.setVolume(currentVolume));
  };

  const handlePlayPause = () => {
    const plumeUi = getGuiInstance();
    const plume = plumeUi.getState();

    const isPlaying = !plume.audioElement.paused;
    // Guard against circular dispatch: when a subscription calls play()/pause(), the resulting event arrives with a state already reflected in the store.
    if (isPlaying === appCore.getState().isPlaying) return;
    appCore.dispatch(coreActions.setIsPlaying(isPlaying));
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
