import { PLUME_CONSTANTS, PLUME_ELEM_IDENTIFIERS } from "../domain/plume";
import { getPlumeUiInstance, PLUME_ACTION_TYPES } from "../infra/AppInstanceImpl";
import { getStoreInstance } from "../infra/AppStoreImpl";
import { PLUME_SVG } from "../svg/icons";
import { getString } from "./i18n";
import { CPL, logger } from "./logger";
import type { CleanupCallback, SubscriptionCallback } from "./types";
import { updateProgressBar } from "./ui/progress";
import { syncMuteBtn } from "./ui/volume";

const { VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

export const setupStoreSubscriptions = (): CleanupCallback => {
  const store = getStoreInstance();
  const subscriptions: Array<SubscriptionCallback> = [];

  subscriptions.push(
    // Subscribe to volume changes to update audio element
    store.subscribe("volume", (volume) => {
      const plumeUi = getPlumeUiInstance();
      const plume = plumeUi.getState();
      plume.audioElement.volume = volume;
      plumeUi.dispatch({ type: PLUME_ACTION_TYPES.SET_AUDIO_ELEMENT, payload: plume.audioElement });
    }),
    // Subscribe to duration display method changes to update display
    store.subscribe("durationDisplayMethod", () => {
      updateProgressBar();
    }),
    // Subscribe to mute state changes
    store.subscribe("isMuted", (isMuted) => {
      const plumeUi = getPlumeUiInstance();
      const plume = plumeUi.getState();

      syncMuteBtn(isMuted);

      // Update volume slider and display
      const currentVolume = store.getState().volume;
      plume.volumeSlider.value = Math.round(currentVolume * VOLUME_SLIDER_GRANULARITY).toString();
      plumeUi.dispatch({ type: PLUME_ACTION_TYPES.SET_VOLUME_SLIDER, payload: plume.volumeSlider });

      const valueDisplay = plume.volumeSlider.parentElement?.querySelector(
        PLUME_ELEM_IDENTIFIERS.volumeValue
      ) as HTMLDivElement | null;
      if (valueDisplay) {
        valueDisplay.textContent = `${plume.volumeSlider.value}${getString("META__PERCENTAGE")}`;
      }

      // Update audio element volume
      plume.audioElement.volume = store.getState().volume;
      plumeUi.dispatch({ type: PLUME_ACTION_TYPES.SET_AUDIO_ELEMENT, payload: plume.audioElement });
    }),
    // Subscribe to playing state changes
    store.subscribe("isPlaying", (isPlaying) => {
      const playPauseBtns = document.querySelectorAll(PLUME_ELEM_IDENTIFIERS.playPauseBtn);
      playPauseBtns.forEach((btn) => {
        btn.innerHTML = isPlaying ? PLUME_SVG.playPause : PLUME_SVG.playPlay;
      });
    })
  );

  logger(CPL.INFO, getString("INFO__STATE__SUBSCRIPTIONS_SETUP"));

  // Return cleanup function
  return () => {
    subscriptions.forEach((unsubscribe) => unsubscribe());
  };
};
