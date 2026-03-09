import { LOOP_MODE, PLUME_CONSTANTS } from "../../domain/plume";
import { coreActions } from "../../domain/ports/app-core";
import { guiActions } from "../../domain/ports/plume-ui";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { getBcPlayerInstance, getMusicPlayerInstance } from "../stores/adapters";
import { getAppCoreInstance } from "../stores/AppCoreImpl";
import { getGuiInstance } from "../stores/GuiImpl";
import type { CleanupCallback } from "./types";
import { syncProgressToStore } from "./ui";

const { VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

export interface AudioEventCallbacks {
  updateTrackDisplay: () => void;
  updateTrackForwardBtnState: () => void;
}

export const setupAudioEventListeners = (callbacks: AudioEventCallbacks): CleanupCallback => {
  const musicPlayer = getMusicPlayerInstance();
  const appCore = getAppCoreInstance();
  const plumeUi = getGuiInstance();
  const plume = plumeUi.getState();
  const { updateTrackDisplay, updateTrackForwardBtnState } = callbacks;

  const handleTimeUpdate = () => {
    syncProgressToStore();
  };

  const handleLoadedMetadata = () => {
    syncProgressToStore();
    updateTrackDisplay();
    updateTrackForwardBtnState();
  };

  const handleDurationChange = () => {
    syncProgressToStore();
  };

  const handleLoadStart = () => {
    updateTrackDisplay();
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

  const handleEnded = () => {
    const pageType = appCore.getState().pageType;
    const loopMode = appCore.getState().loopMode;
    if (pageType === "album" && loopMode !== LOOP_MODE.COLLECTION) return;

    // Band-aid solution for the fact that BC locks the player when "ended" is emitted.
    const bcPlayer = getBcPlayerInstance();
    const nextBtn = bcPlayer.getNextTrackButton();
    const prevBtn = bcPlayer.getPreviousTrackButton();
    nextBtn?.click();
    prevBtn?.click();
  };

  musicPlayer.on("timeupdate", handleTimeUpdate);
  musicPlayer.on("loadedmetadata", handleLoadedMetadata);
  musicPlayer.on("durationchange", handleDurationChange);
  musicPlayer.on("loadstart", handleLoadStart);
  musicPlayer.on("volumechange", handleVolumeChange);
  musicPlayer.on("play", handlePlayPause);
  musicPlayer.on("pause", handlePlayPause);
  musicPlayer.on("ended", handleEnded);

  logger(CPL.INFO, getString("INFO__AUDIO_EVENT_LISTENERS__SET_UP"));

  return () => {
    musicPlayer.off("timeupdate", handleTimeUpdate);
    musicPlayer.off("loadedmetadata", handleLoadedMetadata);
    musicPlayer.off("durationchange", handleDurationChange);
    musicPlayer.off("loadstart", handleLoadStart);
    musicPlayer.off("volumechange", handleVolumeChange);
    musicPlayer.off("play", handlePlayPause);
    musicPlayer.off("pause", handlePlayPause);
    musicPlayer.off("ended", handleEnded);
  };
};
