import { updateTrackForwardBtnState } from "@/app/features/observers";
import type { CleanupCallback, SubscriptionCallback } from "@/app/features/types";
import { syncLoopBtn } from "@/app/features/ui/loop";
import { syncMuteBtn } from "@/app/features/ui/volume";
import { getMusicPlayerInstance } from "@/app/stores/adapters";
import { getAppCoreInstance } from "@/app/stores/AppCoreImpl";
import { getGuiInstance } from "@/app/stores/GuiImpl";
import { PLUME_CONSTANTS } from "@/domain/plume";
import { guiActions } from "@/domain/ports/plume-ui";
import { PLUME_ELEM_SELECTORS } from "@/infra/elements/plume";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";
import { presentFormattedTime } from "@/shared/presenters";
import { setSvgContent } from "@/shared/svg";
import { PLUME_SVG } from "@/svg/icons";

const { VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

export const setupStoreSubscriptions = (): CleanupCallback => {
  const appCore = getAppCoreInstance();
  const storeSubscriptions: Array<SubscriptionCallback> = [];
  const plume = getGuiInstance().getState();

  // Cached once at setup time since plume-volume-value is a static node.
  const volumeValueDisplay = plume.volumeSlider.parentElement?.querySelector(
    PLUME_ELEM_SELECTORS.volumeValue
  ) as HTMLDivElement | null;

  storeSubscriptions.push(
    appCore.subscribe("currentTime", () => {
      const plumeUi = getGuiInstance();
      const plume = plumeUi.getState();
      const state = appCore.getState();

      const elapsed = state.currentTime;
      const duration = state.duration;

      if (Number.isNaN(elapsed) || Number.isNaN(duration) || duration === 0) return;

      const progressPercentage = (elapsed / duration) * 100;
      const bgImg = `linear-gradient(90deg, var(--color-progbar-fill-left) ${progressPercentage.toFixed(1)}%, var(--color-progbar-bg) 0%)`;

      plume.progressSlider.value = `${progressPercentage * (PLUME_CONSTANTS.PROGRESS_SLIDER_GRANULARITY / 100)}`;
      plume.progressSlider.style.backgroundImage = bgImg;
      plume.progressSlider.setAttribute(
        "aria-valuetext",
        getString("ARIA__PROGRESS_VALUETEXT", [presentFormattedTime(elapsed), presentFormattedTime(duration)])
      );

      // Update time displays
      plume.elapsedDisplay.textContent = presentFormattedTime(elapsed);
      plume.durationDisplay.textContent = appCore.computed.formattedDuration();
    }),
    appCore.subscribe("volume", (volume) => {
      const plumeUi = getGuiInstance();
      const plume = plumeUi.getState();

      const musicPlayer = getMusicPlayerInstance();
      musicPlayer.setVolume(volume);

      plume.volumeSlider.value = Math.round(volume * VOLUME_SLIDER_GRANULARITY).toString();
      plume.volumeSlider.setAttribute("aria-valuetext", `${plume.volumeSlider.value}${getString("META__PERCENTAGE")}`);

      // Update volume display text (store as single source of truth)
      if (volumeValueDisplay) {
        volumeValueDisplay.textContent = `${plume.volumeSlider.value}${getString("META__PERCENTAGE")}`;
      }
      plumeUi.dispatch(guiActions.setVolumeSlider(plume.volumeSlider));
    }),
    appCore.subscribe("durationDisplayMethod", () => {
      const plumeUi = getGuiInstance();
      const plume = plumeUi.getState();

      plume.durationDisplay.textContent = appCore.computed.formattedDuration();
    }),
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

      const musicPlayer = getMusicPlayerInstance();
      musicPlayer.setVolume(appCore.getState().volume);
    }),
    appCore.subscribe("loopMode", (loopMode) => {
      syncLoopBtn(loopMode);
      updateTrackForwardBtnState();
    }),
    appCore.subscribe("pageType", () => {
      syncLoopBtn(appCore.getState().loopMode);
    }),
    appCore.subscribe("isPlaying", (isPlaying) => {
      const musicPlayer = getMusicPlayerInstance();
      if (isPlaying && musicPlayer.isPaused()) musicPlayer.play();
      else if (!isPlaying && !musicPlayer.isPaused()) musicPlayer.pause();

      const plume = getGuiInstance().getState();
      plume.playPauseBtns.forEach((btn) => {
        setSvgContent(btn, isPlaying ? PLUME_SVG.playPause : PLUME_SVG.playPlay);
      });
    })
  );

  logger(CPL.INFO, getString("INFO__STATE__SUBSCRIPTIONS_SETUP"));

  return () => {
    storeSubscriptions.forEach((unsubscribe) => unsubscribe());
  };
};
