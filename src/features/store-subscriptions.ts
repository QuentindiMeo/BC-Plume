import { PLUME_CONSTANTS, PLUME_ELEM_IDENTIFIERS } from "../domain/plume";
import { getPlumeUiInstance, plumeActions } from "../infra/AppInstanceImpl";
import { getStoreInstance } from "../infra/AppStoreImpl";
import { PLUME_SVG } from "../svg/icons";
import { getString } from "./i18n";
import { CPL, logger } from "./logger";
import type { CleanupCallback, SubscriptionCallback } from "./types";
import { syncMuteBtn } from "./ui/volume";

const { VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

// Flag to prevent audio event handlers from dispatching during subscription updates
let isUpdatingFromSubscription = false;

export const isPlaybackUpdatingFromSubscription = (): boolean => isUpdatingFromSubscription;

export const setupStoreSubscriptions = (): CleanupCallback => {
  const store = getStoreInstance();
  const subscriptions: Array<SubscriptionCallback> = [];

  subscriptions.push(
    // Subscribe to currentTime changes to update main progress slider
    store.subscribe("currentTime", () => {
      const plumeUi = getPlumeUiInstance();
      const plume = plumeUi.getState();
      const state = store.getState();

      const elapsed = state.currentTime;
      const duration = state.duration;

      if (Number.isNaN(elapsed) || Number.isNaN(duration)) return;

      const songProgressPercentage = (elapsed / duration) * 100;
      const bgPercent = songProgressPercentage < 50 ? songProgressPercentage + 1 : songProgressPercentage - 1;
      const bgImg = `linear-gradient(90deg, var(--progbar-fill-bg-left) ${bgPercent.toFixed(1)}%, var(--progbar-bg) 0%)`;

      plume.progressSlider.value = `${songProgressPercentage * (PLUME_CONSTANTS.PROGRESS_SLIDER_GRANULARITY / 100)}`;
      plume.progressSlider.style.backgroundImage = bgImg;

      // Update time displays
      const elapsedMinutes = Math.floor(elapsed / 60);
      const elapsedSeconds = Math.floor(elapsed % 60);
      plume.elapsedDisplay.textContent = `${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, "0")}`;

      let durationDisplayText: string;
      if (state.durationDisplayMethod === "duration") {
        const durationMinutes = Math.floor(duration / 60);
        const durationSeconds = Math.floor(duration % 60);
        durationDisplayText = `${durationMinutes}:${durationSeconds.toString().padStart(2, "0")}`;
      } else {
        const remainingSeconds = Math.floor(duration - elapsed);
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const remainingSecondsDisplay = remainingSeconds % 60;
        durationDisplayText = `-${remainingMinutes}:${remainingSecondsDisplay.toString().padStart(2, "0")}`;
      }

      plume.durationDisplay.textContent = durationDisplayText;
    }),
    // Subscribe to volume changes to update audio element, slider, and display
    store.subscribe("volume", (volume) => {
      const plumeUi = getPlumeUiInstance();
      const plume = plumeUi.getState();

      plume.audioElement.volume = volume;
      plumeUi.dispatch(plumeActions.setAudioElement(plume.audioElement));

      plume.volumeSlider.value = Math.round(volume * VOLUME_SLIDER_GRANULARITY).toString();

      // Update volume display text (store as single source of truth)
      const valueDisplay = plume.volumeSlider.parentElement?.querySelector(
        PLUME_ELEM_IDENTIFIERS.volumeValue
      ) as HTMLDivElement | null;
      if (valueDisplay) {
        valueDisplay.textContent = `${plume.volumeSlider.value}${getString("META__PERCENTAGE")}`;
      }
      plumeUi.dispatch(plumeActions.setVolumeSlider(plume.volumeSlider));
    }),
    // Subscribe to duration display method changes to update display
    store.subscribe("durationDisplayMethod", () => {
      const plumeUi = getPlumeUiInstance();
      const plume = plumeUi.getState();
      const state = store.getState();

      const elapsed = state.currentTime;
      const duration = state.duration;

      let durationDisplayText: string;
      if (state.durationDisplayMethod === "duration") {
        const durationMinutes = Math.floor(duration / 60);
        const durationSeconds = Math.floor(duration % 60);
        durationDisplayText = `${durationMinutes}:${durationSeconds.toString().padStart(2, "0")}`;
      } else {
        const remainingSeconds = Math.floor(duration - elapsed);
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const remainingSecondsDisplay = remainingSeconds % 60;
        durationDisplayText = `-${remainingMinutes}:${remainingSecondsDisplay.toString().padStart(2, "0")}`;
      }

      plume.durationDisplay.textContent = durationDisplayText;
    }),
    // Subscribe to mute state changes
    store.subscribe("isMuted", (isMuted) => {
      const plumeUi = getPlumeUiInstance();
      const plume = plumeUi.getState();

      syncMuteBtn(isMuted);

      // Update volume slider and display
      const currentVolume = store.getState().volume;
      plume.volumeSlider.value = Math.round(currentVolume * VOLUME_SLIDER_GRANULARITY).toString();
      plumeUi.dispatch(plumeActions.setVolumeSlider(plume.volumeSlider));

      const valueDisplay = plume.volumeSlider.parentElement?.querySelector(
        PLUME_ELEM_IDENTIFIERS.volumeValue
      ) as HTMLDivElement | null;
      if (valueDisplay) {
        valueDisplay.textContent = `${plume.volumeSlider.value}${getString("META__PERCENTAGE")}`;
      }

      // Update audio element volume
      plume.audioElement.volume = store.getState().volume;
      plumeUi.dispatch(plumeActions.setAudioElement(plume.audioElement));
    }),
    // Subscribe to playing state changes
    store.subscribe("isPlaying", (isPlaying) => {
      const plumeUi = getPlumeUiInstance();
      const plume = plumeUi.getState();

      // Set flag to prevent audio event handlers from dispatching
      isUpdatingFromSubscription = true;

      try {
        // Update audio element playback state (store as single source of truth)
        if (isPlaying && plume.audioElement.paused) {
          plume.audioElement.play();
        } else if (!isPlaying && !plume.audioElement.paused) {
          plume.audioElement.pause();
        }

        // Update play/pause button icons
        const playPauseBtns = document.querySelectorAll(PLUME_ELEM_IDENTIFIERS.playPauseBtn);
        playPauseBtns.forEach((btn) => {
          btn.innerHTML = isPlaying ? PLUME_SVG.playPause : PLUME_SVG.playPlay;
        });
        plumeUi.dispatch(plumeActions.setAudioElement(plume.audioElement));
      } finally {
        // Reset flag after a tick to allow audio events to process
        setTimeout(() => {
          isUpdatingFromSubscription = false;
        }, 0);
      }
    })
  );

  logger(CPL.INFO, getString("INFO__STATE__SUBSCRIPTIONS_SETUP"));

  // Return cleanup function
  return () => {
    subscriptions.forEach((unsubscribe) => unsubscribe());
  };
};
