import { PLUME_CONSTANTS } from "../../domain/plume";
import { musicPlayer } from "../../infra/adapters";
import { PLUME_ELEM_SELECTORS } from "../../infra/elements/plume";
import { CPL, logger } from "../../shared/logger";
import { PLUME_SVG } from "../../svg/icons";
import { getAppCoreInstance } from "../stores/AppCoreImpl";
import { getGuiInstance, guiActions } from "../stores/GuiImpl";
import { getString } from "./i18n";
import { presentFormattedTime } from "./presenters";
import type { CleanupCallback, SubscriptionCallback } from "./types";
import { syncMuteBtn } from "./ui/volume";

const { VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

export const setupStoreSubscriptions = (): CleanupCallback => {
  const appCore = getAppCoreInstance();
  const storeSubscriptions: Array<SubscriptionCallback> = [];
  const plume = getGuiInstance().getState();

  // Cached once at setup time since bpe-volume-value is a static node.
  const volumeValueDisplay = plume.volumeSlider.parentElement?.querySelector(
    PLUME_ELEM_SELECTORS.volumeValue
  ) as HTMLDivElement | null;

  storeSubscriptions.push(
    // Subscribe to currentTime changes to update main progress slider
    appCore.subscribe("currentTime", () => {
      const plumeUi = getGuiInstance();
      const plume = plumeUi.getState();
      const state = appCore.getState();

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
      plume.durationDisplay.textContent = appCore.computed.formattedDuration();
    }),
    // Subscribe to volume changes to update audio element, slider, and display
    appCore.subscribe("volume", (volume) => {
      const plumeUi = getGuiInstance();
      const plume = plumeUi.getState();

      musicPlayer.setVolume(volume);

      plume.volumeSlider.value = Math.round(volume * VOLUME_SLIDER_GRANULARITY).toString();

      // Update volume display text (store as single source of truth)
      if (volumeValueDisplay) {
        volumeValueDisplay.textContent = `${plume.volumeSlider.value}${getString("META__PERCENTAGE")}`;
      }
      plumeUi.dispatch(guiActions.setVolumeSlider(plume.volumeSlider));
    }),
    // Subscribe to duration display method changes to update display
    appCore.subscribe("durationDisplayMethod", () => {
      const plumeUi = getGuiInstance();
      const plume = plumeUi.getState();

      plume.durationDisplay.textContent = appCore.computed.formattedDuration();
    }),
    // Subscribe to mute state changes
    appCore.subscribe("isMuted", (isMuted) => {
      const plumeUi = getGuiInstance();
      const plume = plumeUi.getState();

      syncMuteBtn(isMuted);

      // Update volume slider and display
      const currentVolume = appCore.getState().volume;
      plume.volumeSlider.value = Math.round(currentVolume * VOLUME_SLIDER_GRANULARITY).toString();
      plumeUi.dispatch(guiActions.setVolumeSlider(plume.volumeSlider));

      if (volumeValueDisplay) {
        volumeValueDisplay.textContent = `${plume.volumeSlider.value}${getString("META__PERCENTAGE")}`;
      }

      musicPlayer.setVolume(appCore.getState().volume);
    }),
    // Subscribe to playing state changes
    appCore.subscribe("isPlaying", (isPlaying) => {
      if (isPlaying && musicPlayer.isPaused()) {
        musicPlayer.play();
      } else if (!isPlaying && !musicPlayer.isPaused()) {
        musicPlayer.pause();
      }

      // Update play/pause button icons
      const playPauseBtns = document.querySelectorAll(PLUME_ELEM_SELECTORS.playPauseBtn);
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
