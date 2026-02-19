import { PLUME_CONSTANTS, PLUME_ELEM_IDENTIFIERS } from "../domain/plume";
import { getPlumeUiInstance, plumeActions } from "../infra/AppInstanceImpl";
import { getStoreInstance } from "../infra/AppStoreImpl";
import { PLUME_SVG } from "../svg/icons";
import { getString } from "./i18n";
import { CPL, logger } from "./logger";
import { presentFormattedDuration, presentFormattedTime } from "./presenters";
import type { CleanupCallback, SubscriptionCallback } from "./types";
import { syncMuteBtn } from "./ui/volume";

const { VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

export const setupStoreSubscriptions = (): CleanupCallback => {
  const store = getStoreInstance();
  const storeSubscriptions: Array<SubscriptionCallback> = [];
  const plume = getPlumeUiInstance().getState();

  // Cached once at setup time since bpe-volume-value is a static node.
  const volumeValueDisplay = plume.volumeSlider.parentElement?.querySelector(
    PLUME_ELEM_IDENTIFIERS.volumeValue
  ) as HTMLDivElement | null;

  storeSubscriptions.push(
    // Subscribe to currentTime changes to update main progress slider
    store.subscribe("currentTime", () => {
      const plumeUi = getPlumeUiInstance();
      const plume = plumeUi.getState();
      const state = store.getState();

      const elapsed = state.currentTime;
      const duration = state.duration;

      if (Number.isNaN(elapsed) || Number.isNaN(duration) || duration === 0) return;

      const songProgressPercentage = (elapsed / duration) * 100;
      const bgPercent = songProgressPercentage < 50 ? songProgressPercentage + 1 : songProgressPercentage - 1;
      const bgImg = `linear-gradient(90deg, var(--progbar-fill-bg-left) ${bgPercent.toFixed(1)}%, var(--progbar-bg) 0%)`;

      plume.progressSlider.value = `${songProgressPercentage * (PLUME_CONSTANTS.PROGRESS_SLIDER_GRANULARITY / 100)}`;
      plume.progressSlider.style.backgroundImage = bgImg;

      // Update time displays
      plume.elapsedDisplay.textContent = presentFormattedTime(elapsed);
      plume.durationDisplay.textContent = presentFormattedDuration(state);
    }),
    // Subscribe to volume changes to update audio element, slider, and display
    store.subscribe("volume", (volume) => {
      const plumeUi = getPlumeUiInstance();
      const plume = plumeUi.getState();

      plume.audioElement.volume = volume;

      plume.volumeSlider.value = Math.round(volume * VOLUME_SLIDER_GRANULARITY).toString();

      // Update volume display text (store as single source of truth)
      if (volumeValueDisplay) {
        volumeValueDisplay.textContent = `${plume.volumeSlider.value}${getString("META__PERCENTAGE")}`;
      }
      plumeUi.dispatch(plumeActions.setVolumeSlider(plume.volumeSlider));
    }),
    // Subscribe to duration display method changes to update display
    store.subscribe("durationDisplayMethod", () => {
      const plumeUi = getPlumeUiInstance();
      const plume = plumeUi.getState();
      const state = store.getState();

      plume.durationDisplay.textContent = presentFormattedDuration(state);
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

      if (volumeValueDisplay) {
        volumeValueDisplay.textContent = `${plume.volumeSlider.value}${getString("META__PERCENTAGE")}`;
      }

      // Update audio element volume
      plume.audioElement.volume = store.getState().volume;
    }),
    // Subscribe to playing state changes
    store.subscribe("isPlaying", (isPlaying) => {
      const plumeUi = getPlumeUiInstance();
      const plume = plumeUi.getState();

      // Update audio element playback state (store as single source of truth).
      // Audio events guard against re-entrant dispatch via idempotent comparison:
      // if the audio element's state already matches the store, the resulting play/pause event will not trigger a redundant dispatch.
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
    })
  );

  logger(CPL.INFO, getString("INFO__STATE__SUBSCRIPTIONS_SETUP"));

  // Return cleanup function
  return () => {
    storeSubscriptions.forEach((unsubscribe) => unsubscribe());
  };
};
