import { PLUME_CONSTANTS } from "../../domain/plume";
import { musicPlayer } from "../../infra/adapters";
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

    const currentVolume = musicPlayer.getVolume();
    plume.volumeSlider.value = `${Math.round(currentVolume * VOLUME_SLIDER_GRANULARITY)}`;
    plumeUi.dispatch(guiActions.setVolumeSlider(plume.volumeSlider));

    const currentIsMuted = appCore.getState().isMuted;
    const newIsMuted = currentVolume === 0;
    if (currentIsMuted !== newIsMuted) {
      appCore.dispatch(coreActions.setIsMuted(newIsMuted));
    }
    appCore.dispatch(coreActions.setVolume(currentVolume));
  };

  const handlePlayPause = () => {
    const isPlaying = !musicPlayer.isPaused();
    // Guard against circular dispatch: when a subscription calls play()/pause(), the resulting event arrives with a state already reflected in the store.
    if (isPlaying === appCore.getState().isPlaying) return;
    appCore.dispatch(coreActions.setIsPlaying(isPlaying));
  };

  musicPlayer.on("timeupdate", handleTimeUpdate);
  musicPlayer.on("loadedmetadata", handleLoadedMetadata);
  musicPlayer.on("durationchange", handleDurationChange);
  musicPlayer.on("loadstart", handleLoadStart);
  musicPlayer.on("volumechange", handleVolumeChange);
  musicPlayer.on("play", handlePlayPause);
  musicPlayer.on("pause", handlePlayPause);

  logger(CPL.INFO, getString("INFO__AUDIO_EVENT_LISTENERS__SET_UP"));

  return () => {
    musicPlayer.off("timeupdate", handleTimeUpdate);
    musicPlayer.off("loadedmetadata", handleLoadedMetadata);
    musicPlayer.off("durationchange", handleDurationChange);
    musicPlayer.off("loadstart", handleLoadStart);
    musicPlayer.off("volumechange", handleVolumeChange);
    musicPlayer.off("play", handlePlayPause);
    musicPlayer.off("pause", handlePlayPause);
  };
};
