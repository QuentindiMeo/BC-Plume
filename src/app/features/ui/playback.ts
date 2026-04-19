import { applyLoopBtnState, handleLoopCycle } from "@/app/features/ui/loop";
import { getBcPlayerInstance, getMusicPlayerInstance } from "@/app/stores/adapters";
import { getAppCoreInstance } from "@/app/stores/AppCoreImpl";
import { getGuiInstance } from "@/app/stores/GuiImpl";
import {
  cyclePlaybackSpeed,
  navigateTrackBackward,
  navigateTrackForward,
  seekBackward,
  seekForward,
  togglePlayback,
} from "@/app/use-cases";
import { PLAYBACK_SPEED_STEPS, parseCustomPlaybackSpeed, speedToSliderPosition } from "@/domain/plume";
import { coreActions } from "@/domain/ports/app-core";
import { guiActions } from "@/domain/ports/plume-ui";
import { PLUME_ELEM_SELECTORS } from "@/infra/elements/plume";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";
import { setSvgContent } from "@/shared/svg";
import { PLUME_SVG } from "@/svg/icons";
import { createToast } from "./toast";

export const setupSpeedLabelClickBehavior = (wrapper: HTMLDivElement): (() => void) => {
  const labelClass = PLUME_ELEM_SELECTORS.speedLabel.split(".")[1];
  const customInputClass = PLUME_ELEM_SELECTORS.speedCustomInput.split(".")[1];
  const label = wrapper.querySelector<HTMLElement>(`.${labelClass}`);
  const customInput = wrapper.querySelector<HTMLInputElement>(`.${customInputClass}`);
  if (!label || !customInput) return () => {};

  const openInput = (): void => {
    const currentSpeed = getAppCoreInstance().getState().playbackSpeed;
    customInput.value = String(currentSpeed);
    customInput.removeAttribute("aria-invalid");
    label.ariaExpanded = "true";
    label.hidden = true;
    customInput.hidden = false;
    customInput.select();
    customInput.focus();
  };

  const closeInput = (): void => {
    customInput.hidden = true;
    label.ariaExpanded = "false";
    label.hidden = false;
  };

  const onLabelClick = (): void => openInput();
  const onLabelKeydown = (e: KeyboardEvent): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openInput();
    }
  };
  const onInputKeydown = (e: KeyboardEvent): void => {
    if (e.key === "Enter") {
      e.preventDefault();

      const parsed = parseCustomPlaybackSpeed(customInput.value);
      if (parsed !== null) {
        getAppCoreInstance().dispatch(coreActions.setPlaybackSpeed(parsed));
        closeInput();
        label.focus();
      } else {
        customInput.setAttribute("aria-invalid", "true");
        logger(CPL.DEBUG, getString("DEBUG__SPEED__CUSTOM_INPUT__INVALID"));
        createToast({
          label: getString("META__TOAST__CUSTOM_INPUT_INVALID"),
          title: getString("LABEL__TOAST__CUSTOM_INPUT__INVALID__TITLE"),
          description: getString("LABEL__TOAST__CUSTOM_INPUT__INVALID__DESCRIPTION"),
          borderType: "warning",
        });
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeInput();
    }
  };
  const onInputBlur = (): void => {
    if (customInput.hidden) return;

    const parsed = parseCustomPlaybackSpeed(customInput.value);
    if (parsed !== null) {
      const appCore = getAppCoreInstance();
      appCore.dispatch(coreActions.setPlaybackSpeed(parsed));
    }

    closeInput();
  };
  const onInputInput = (): void => {
    customInput.removeAttribute("aria-invalid");
  };

  label.role = "button";
  label.tabIndex = 0;
  label.title = getString("LABEL__SPEED__CLICK_TO_EDIT");
  label.ariaExpanded = "false";
  label.addEventListener("click", onLabelClick);
  label.addEventListener("keydown", onLabelKeydown);
  customInput.addEventListener("keydown", onInputKeydown);
  customInput.addEventListener("blur", onInputBlur);
  customInput.addEventListener("input", onInputInput);

  return (): void => {
    label.removeEventListener("click", onLabelClick);
    label.removeEventListener("keydown", onLabelKeydown);
    customInput.removeEventListener("keydown", onInputKeydown);
    customInput.removeEventListener("blur", onInputBlur);
    customInput.removeEventListener("input", onInputInput);
  };
};

export const setupSpeedPopoverBehavior = (wrapper: HTMLDivElement): (() => void) => {
  const popoverClassName = PLUME_ELEM_SELECTORS.speedPopover.split(".")[1];
  const popover = wrapper.querySelector<HTMLDivElement>(`.${popoverClassName}`);
  if (!popover) return () => {};

  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  const show = (): void => {
    if (hideTimer !== null) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    popover.classList.add(`${popoverClassName}--visible`);
    popover.ariaHidden = "false";
  };

  const scheduleHide = (): void => {
    const customInputClass = PLUME_ELEM_SELECTORS.speedCustomInput.split(".")[1];
    const customInput = wrapper.querySelector<HTMLInputElement>(`.${customInputClass}`);
    if (customInput && !customInput.hidden) return;
    hideTimer = setTimeout(() => {
      popover.classList.remove(`${popoverClassName}--visible`);
      popover.ariaHidden = "true";
      hideTimer = null;
    }, 700);
  };

  const onFocusOut = (e: FocusEvent): void => {
    if (!wrapper.contains(e.relatedTarget as Node)) scheduleHide();
  };

  wrapper.addEventListener("mouseenter", show);
  wrapper.addEventListener("mouseleave", scheduleHide);
  wrapper.addEventListener("focusin", show);
  wrapper.addEventListener("focusout", onFocusOut);

  return (): void => {
    if (hideTimer !== null) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    wrapper.removeEventListener("mouseenter", show);
    wrapper.removeEventListener("mouseleave", scheduleHide);
    wrapper.removeEventListener("focusin", show);
    wrapper.removeEventListener("focusout", onFocusOut);
  };
};

export const handleSpeedCycle = (): void => {
  logger(CPL.DEBUG, getString("DEBUG__SPEED__CLICKED"));

  const appCore = getAppCoreInstance();
  cyclePlaybackSpeed(appCore);
};

export const handleSpeedSlider = (e: Event): void => {
  const slider = e.currentTarget as HTMLInputElement;
  const rawIdx = Math.round(parseFloat(slider.value));
  const clampedIdx = Math.max(0, Math.min(rawIdx, PLAYBACK_SPEED_STEPS.length - 1));
  slider.value = String(clampedIdx); // snap thumb to nearest tick before next repaint

  const appCore = getAppCoreInstance();
  const speed = PLAYBACK_SPEED_STEPS[clampedIdx];
  appCore.dispatch(coreActions.setPlaybackSpeed(speed));
};

export const handleSpeedSliderKeydown = (e: KeyboardEvent): void => {
  const slider = e.currentTarget as HTMLInputElement;
  const pos = parseFloat(slider.value);
  if (!Number.isFinite(pos)) return;

  const lastIdx = PLAYBACK_SPEED_STEPS.length - 1;
  let nextIdx: number;

  switch (e.key) {
    case "ArrowRight":
    case "ArrowUp":
      nextIdx = Math.min(Math.floor(pos) + 1, lastIdx);
      break;
    case "ArrowLeft":
    case "ArrowDown":
      nextIdx = Math.max(Math.ceil(pos) - 1, 0);
      break;
    case "Home":
      nextIdx = 0;
      break;
    case "End":
      nextIdx = lastIdx;
      break;
    default:
      return;
  }
  e.preventDefault();

  slider.value = String(nextIdx);
  const speed = PLAYBACK_SPEED_STEPS[nextIdx];
  if (speed !== undefined) {
    const appCore = getAppCoreInstance();
    appCore.dispatch(coreActions.setPlaybackSpeed(speed));
  }
};

export const handleTrackBackward = (): void => {
  logger(CPL.DEBUG, getString("DEBUG__PREV_TRACK__CLICKED"));

  const appCore = getAppCoreInstance();
  const musicPlayer = getMusicPlayerInstance();
  const bcPlayer = getBcPlayerInstance();
  navigateTrackBackward(appCore, musicPlayer, bcPlayer);
};

export const handleTimeBackward = (): void => {
  logger(CPL.DEBUG, getString("DEBUG__REWIND_TIME__CLICKED"));

  const appCore = getAppCoreInstance();
  const musicPlayer = getMusicPlayerInstance();
  seekBackward(appCore, musicPlayer);
};

export const handlePlayPause = (): void => {
  logger(CPL.DEBUG, getString("DEBUG__PLAY_PAUSE__CLICKED"));

  const appCore = getAppCoreInstance();
  togglePlayback(appCore);
};

export const handleTimeForward = (): void => {
  logger(CPL.DEBUG, getString("DEBUG__FORWARD_TIME__CLICKED"));

  const appCore = getAppCoreInstance();
  const musicPlayer = getMusicPlayerInstance();
  seekForward(appCore, musicPlayer);
};

export const handleTrackForward = (): void => {
  logger(CPL.DEBUG, getString("DEBUG__NEXT_TRACK__CLICKED"));

  const appCore = getAppCoreInstance();
  const musicPlayer = getMusicPlayerInstance();
  const bcPlayer = getBcPlayerInstance();
  navigateTrackForward(appCore, musicPlayer, bcPlayer);
};

export const createPlaybackControlPanel = (): HTMLDivElement => {
  const appState = getAppCoreInstance().getState();
  const plumeUi = getGuiInstance();
  const container = document.createElement("div");
  container.id = PLUME_ELEM_SELECTORS.playbackControls.split("#")[1];

  const trackBackwardBtn = document.createElement("button");
  trackBackwardBtn.id = PLUME_ELEM_SELECTORS.trackBwdBtn.split("#")[1];
  trackBackwardBtn.type = "button";
  setSvgContent(trackBackwardBtn, PLUME_SVG.trackBackward);
  trackBackwardBtn.title = getString("LABEL__TRACK_BACKWARD");
  trackBackwardBtn.ariaLabel = getString("LABEL__TRACK_BACKWARD");
  trackBackwardBtn.addEventListener("click", handleTrackBackward);

  const timeBackwardBtn = document.createElement("button");
  timeBackwardBtn.id = PLUME_ELEM_SELECTORS.timeBwdBtn.split("#")[1];
  timeBackwardBtn.type = "button";
  setSvgContent(timeBackwardBtn, PLUME_SVG.timeBackward);
  timeBackwardBtn.title = getString("LABEL__TIME_BACKWARD");
  timeBackwardBtn.ariaLabel = getString("LABEL__TIME_BACKWARD");
  timeBackwardBtn.addEventListener("click", handleTimeBackward);

  const playPauseBtn = document.createElement("button");
  playPauseBtn.id = PLUME_ELEM_SELECTORS.playPauseBtn.split("#")[1];
  playPauseBtn.type = "button";
  setSvgContent(playPauseBtn, getMusicPlayerInstance().isPaused() ? PLUME_SVG.playPlay : PLUME_SVG.playPause);
  playPauseBtn.title = getString("LABEL__PLAY_PAUSE");
  playPauseBtn.ariaLabel = getString("LABEL__PLAY_PAUSE");
  playPauseBtn.addEventListener("click", handlePlayPause);

  const timeForwardBtn = document.createElement("button");
  timeForwardBtn.id = PLUME_ELEM_SELECTORS.timeFwdBtn.split("#")[1];
  timeForwardBtn.type = "button";
  setSvgContent(timeForwardBtn, PLUME_SVG.timeForward);
  timeForwardBtn.title = getString("LABEL__TIME_FORWARD");
  timeForwardBtn.ariaLabel = getString("LABEL__TIME_FORWARD");
  timeForwardBtn.addEventListener("click", handleTimeForward);

  const trackForwardBtn = document.createElement("button");
  trackForwardBtn.id = PLUME_ELEM_SELECTORS.trackFwdBtn.split("#")[1];
  trackForwardBtn.type = "button";
  setSvgContent(trackForwardBtn, PLUME_SVG.trackForward);
  trackForwardBtn.title = getString("LABEL__TRACK_FORWARD");
  trackForwardBtn.ariaLabel = getString("LABEL__TRACK_FORWARD");
  trackForwardBtn.addEventListener("click", handleTrackForward);

  const withSpeedControl = appState.featureFlags.speedControl;
  if (withSpeedControl) {
    const speedWrapper = document.createElement("div");
    speedWrapper.id = PLUME_ELEM_SELECTORS.speedWrapper.split("#")[1];

    const speedBtn = document.createElement("button");
    speedBtn.id = PLUME_ELEM_SELECTORS.speedBtn.split("#")[1];
    speedBtn.type = "button";
    setSvgContent(speedBtn, PLUME_SVG.speedGauge);
    speedBtn.title = getString("LABEL__SPEED");
    speedBtn.ariaLabel = getString("LABEL__SPEED");
    speedBtn.addEventListener("click", handleSpeedCycle);

    const speedPopover = document.createElement("div");
    speedPopover.className = PLUME_ELEM_SELECTORS.speedPopover.split(".")[1];
    speedPopover.ariaHidden = "true";

    const speedLabel = document.createElement("span");
    speedLabel.className = PLUME_ELEM_SELECTORS.speedLabel.split(".")[1];
    speedLabel.textContent = `${appState.playbackSpeed}×`;

    const speedCustomInput = document.createElement("input");
    speedCustomInput.type = "text";
    speedCustomInput.className = PLUME_ELEM_SELECTORS.speedCustomInput.split(".")[1];
    speedCustomInput.hidden = true;
    speedCustomInput.inputMode = "decimal";
    speedCustomInput.ariaLabel = getString("ARIA__SPEED_CUSTOM_INPUT");

    const speedSlider = document.createElement("input");
    speedSlider.type = "range";
    speedSlider.className = PLUME_ELEM_SELECTORS.speedSlider.split(".")[1];
    speedSlider.min = "0";
    speedSlider.max = String(PLAYBACK_SPEED_STEPS.length - 1);
    speedSlider.step = "any";
    speedSlider.value = String(speedToSliderPosition(appState.playbackSpeed));
    speedSlider.ariaLabel = getString("ARIA__SPEED_SLIDER");
    speedSlider.setAttribute("aria-valuemin", "0");
    speedSlider.setAttribute("aria-valuemax", String(PLAYBACK_SPEED_STEPS.length - 1));
    speedSlider.setAttribute("aria-valuetext", `${appState.playbackSpeed}×`);
    speedSlider.addEventListener("input", handleSpeedSlider);
    speedSlider.addEventListener("keydown", handleSpeedSliderKeydown);

    const speedTicks = document.createElement("div");
    speedTicks.className = "plume-speed-ticks";
    speedTicks.ariaHidden = "true";
    for (let i = 0; i < PLAYBACK_SPEED_STEPS.length; i++) speedTicks.appendChild(document.createElement("span"));

    speedPopover.appendChild(speedLabel);
    speedPopover.appendChild(speedCustomInput);
    speedPopover.appendChild(speedSlider);
    speedPopover.appendChild(speedTicks);
    speedWrapper.appendChild(speedBtn);
    speedWrapper.appendChild(speedPopover);

    setupSpeedPopoverBehavior(speedWrapper);
    setupSpeedLabelClickBehavior(speedWrapper);
    container.appendChild(speedWrapper);
    plumeUi.dispatch(guiActions.setSpeedBtns([speedWrapper]));
  }

  container.appendChild(trackBackwardBtn);
  container.appendChild(timeBackwardBtn);
  container.appendChild(playPauseBtn);
  container.appendChild(timeForwardBtn);
  container.appendChild(trackForwardBtn);

  // Seed the store arrays with the main-panel buttons; fullscreen.ts appends its clones
  plumeUi.dispatch(guiActions.setPlayPauseBtns([playPauseBtn]));
  plumeUi.dispatch(guiActions.setTrackFwdBtns([trackForwardBtn]));

  const withLoopModes = appState.featureFlags.loopModes;
  if (withLoopModes) {
    const loopBtn = document.createElement("button");
    loopBtn.id = PLUME_ELEM_SELECTORS.loopBtn.split("#")[1];
    loopBtn.type = "button";
    setSvgContent(loopBtn, PLUME_SVG.loopNone);
    loopBtn.title = getString("ARIA__LOOP__OFF");
    loopBtn.ariaLabel = getString("ARIA__LOOP__OFF");
    loopBtn.ariaPressed = "false";
    loopBtn.addEventListener("click", handleLoopCycle);

    container.appendChild(loopBtn);
    plumeUi.dispatch(guiActions.setLoopBtns([loopBtn]));

    // Apply persisted loop state immediately so button reflects loaded state
    applyLoopBtnState(loopBtn, appState.loopMode);
  }

  return container;
};
