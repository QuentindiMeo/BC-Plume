import { cleanupFullscreenMode } from "@/app/features/fullscreen";
import { updateTrackForwardBtnState } from "@/app/features/observers";
import type { CleanupCallback, SubscriptionCallback } from "@/app/features/types";
import { syncLoopBtn } from "@/app/features/ui/loop";
import { createToast } from "@/app/features/ui/toast";
import { syncMuteBtn } from "@/app/features/ui/volume";
import { getMusicPlayerInstance } from "@/app/stores/adapters";
import { getAppCoreInstance } from "@/app/stores/AppCoreImpl";
import { getGuiInstance } from "@/app/stores/GuiImpl";
import {
  LOOP_MODE,
  PLAYBACK_SPEED_DEFAULT,
  PLAYBACK_SPEED_SAFARI_MAX,
  PLAYBACK_SPEED_SAFARI_MIN,
  PLUME_CONSTANTS,
  speedToSliderPosition,
} from "@/domain/plume";
import { coreActions } from "@/domain/ports/app-core";
import { guiActions } from "@/domain/ports/plume-ui";
import { PLUME_ELEM_SELECTORS } from "@/infra/elements/plume";
import { isSafariBrowser } from "@/shared/browser";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";
import { presentFormattedTime } from "@/shared/presenters";
import { setSvgContent } from "@/shared/svg";
import { PLUME_SVG } from "@/svg/icons";

const { VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

let safariSpeedWarningShown = false;

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

      const progressFraction = elapsed / duration;
      plume.progressSlider.value = `${progressFraction * PLUME_CONSTANTS.PROGRESS_SLIDER_GRANULARITY}`;
      plume.progressSlider.style.setProperty("--progress-fraction", progressFraction.toString());
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
    }),
    appCore.subscribe("playbackSpeed", (speed) => {
      const musicPlayer = getMusicPlayerInstance();
      const plume = getGuiInstance().getState();

      musicPlayer.setPlaybackRate(speed);
      const speedText = `${speed}×`;
      const sliderPos = String(speedToSliderPosition(speed));
      const speedBtnLabel = getString("ARIA__SPEED_BTN", [speedText]);

      plume.speedBtns.forEach((wrapper) => {
        const label = wrapper.querySelector<HTMLElement>(PLUME_ELEM_SELECTORS.speedLabel);
        const slider = wrapper.querySelector<HTMLInputElement>(PLUME_ELEM_SELECTORS.speedSlider);
        const customInput = wrapper.querySelector<HTMLInputElement>(PLUME_ELEM_SELECTORS.speedCustomInput);
        const speedBtn = wrapper.querySelector<HTMLButtonElement>(PLUME_ELEM_SELECTORS.speedBtn);

        if (customInput && !customInput.hidden) {
          customInput.hidden = true;
          if (label) label.hidden = false;
        }
        if (label) label.textContent = speedText;
        if (slider) {
          slider.value = sliderPos;
          slider.setAttribute("aria-valuetext", speedText);
        }
        if (speedBtn) {
          speedBtn.ariaLabel = speedBtnLabel;
          speedBtn.title = speedBtnLabel;
        }
      });

      if (
        !safariSpeedWarningShown &&
        isSafariBrowser() &&
        (speed < PLAYBACK_SPEED_SAFARI_MIN || speed > PLAYBACK_SPEED_SAFARI_MAX)
      ) {
        safariSpeedWarningShown = true;
        createToast({
          label: getString("META__TOAST__SPEED__SAFARI_UNSUPPORTED"),
          title: getString("LABEL__TOAST__SPEED__SAFARI_UNSUPPORTED__TITLE"),
          description: getString("LABEL__TOAST__SPEED__SAFARI_UNSUPPORTED__DESCRIPTION"),
          borderType: "warning",
        });
      }
    }),
    appCore.subscribe("featureFlags", (flags, prevFlags) => {
      // Tracklist: toggle button + dropdown visibility
      if (flags.tracklist !== prevFlags.tracklist) {
        const btn = document.querySelector<HTMLElement>(PLUME_ELEM_SELECTORS.tracklistToggleBtn);
        const dd = document.querySelector<HTMLElement>(PLUME_ELEM_SELECTORS.tracklistDropdown);
        if (btn) btn.hidden = !flags.tracklist;
        if (dd) dd.hidden = !flags.tracklist;
      }

      // Loop modes: toggle button visibility, reset to NONE when disabled
      if (flags.loopModes !== prevFlags.loopModes) {
        const plumeUi = getGuiInstance();
        plumeUi.getState().loopBtns.forEach((btn) => (btn.hidden = !flags.loopModes));
        if (!flags.loopModes) {
          appCore.dispatch(coreActions.setLoopMode(LOOP_MODE.NONE));
          getMusicPlayerInstance().setLoop(false);
        }
      }

      // Fullscreen: toggle button container visibility, exit fullscreen if active
      if (flags.fullscreen !== prevFlags.fullscreen) {
        const section = document.querySelector<HTMLElement>(PLUME_ELEM_SELECTORS.fullscreenBtnContainer);
        if (section) section.hidden = !flags.fullscreen;
        if (!flags.fullscreen && appCore.getState().isFullscreen) {
          cleanupFullscreenMode();
        }
      }

      // Go-to-track: toggle link visibility
      if (flags.goToTrack !== prevFlags.goToTrack) {
        const el = document.querySelector<HTMLElement>(PLUME_ELEM_SELECTORS.headerTrackLink);
        if (el) el.hidden = !flags.goToTrack;
      }

      // Speed control: toggle button visibility, reset to 1× when disabled
      if (flags.speedControl !== prevFlags.speedControl) {
        getGuiInstance()
          .getState()
          .speedBtns.forEach((btn) => (btn.hidden = !flags.speedControl));
        if (!flags.speedControl) {
          appCore.dispatch(coreActions.setPlaybackSpeed(PLAYBACK_SPEED_DEFAULT));
        }
      }

      // Quick seek + runtime: flag is read on trigger (key / button)
    })
  );

  logger(CPL.INFO, getString("INFO__STATE__SUBSCRIPTIONS_SETUP"));

  return () => {
    storeSubscriptions.forEach((unsubscribe) => unsubscribe());
  };
};
