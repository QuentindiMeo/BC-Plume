import { PLUME_CONSTANTS, PLUME_ELEM_IDENTIFIERS } from "../domain/plume";
import { getPlumeUiInstance, PLUME_ACTIONS } from "../infra/AppInstanceImpl";
import { getStoreInstance, STORE_ACTIONS } from "../infra/AppStoreImpl";
import { NoArgFunction } from "../shared/types";
import { getString } from "./i18n";
import { CPL, logger } from "./logger";
import type { CleanupCallback } from "./types";

const { AVAILABLE_HOTKEYS: AVAILABLE_HOTKEY_CODES, VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

interface KeyboardHandlers {
  handlePlayPause: NoArgFunction;
  handleTimeBackward: NoArgFunction;
  handleTimeForward: NoArgFunction;
  handleTrackBackward: NoArgFunction;
  handleTrackForward: NoArgFunction;
  handleMuteToggle: NoArgFunction;
  toggleFullscreenMode: NoArgFunction;
}

export const setupHotkeys = (handlers: KeyboardHandlers): CleanupCallback => {
  const plumeUi = getPlumeUiInstance();
  const store = getStoreInstance();

  const handleAdjustVolume = (delta: number) => {
    const plume = plumeUi.getState();
    const currentValue = Number.parseInt(plume.volumeSlider.value);
    const newValue = Math.max(0, Math.min(VOLUME_SLIDER_GRANULARITY, currentValue + delta));
    plume.volumeSlider.value = newValue.toString();
    plumeUi.dispatch({ type: PLUME_ACTIONS.SET_VOLUME_SLIDER, payload: plume.volumeSlider });

    const volume = newValue / VOLUME_SLIDER_GRANULARITY;
    plume.audioElement.volume = volume;
    plumeUi.dispatch({ type: PLUME_ACTIONS.SET_AUDIO_ELEMENT, payload: plume.audioElement });

    const volumeSliders = document.querySelectorAll(PLUME_ELEM_IDENTIFIERS.volumeSlider);
    volumeSliders.forEach((slider) => {
      (slider as HTMLInputElement).value = newValue.toString();

      const valueDisplay = slider.parentElement!.querySelector(PLUME_ELEM_IDENTIFIERS.volumeValue) as HTMLDivElement;
      valueDisplay.textContent = `${newValue}${getString("META__PERCENTAGE")}`;
    });

    store.dispatch({ type: STORE_ACTIONS.SET_VOLUME, payload: volume });
  };

  const handleKeydown = (e: KeyboardEvent) => {
    const userIsTypingInInput =
      (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) && !e.target.readOnly;
    if (userIsTypingInInput) return; // don't trigger hotkeys when user is typing in an input or textarea

    const isValidHotkey = AVAILABLE_HOTKEY_CODES.has(e.key);
    if (!isValidHotkey) return;

    e.preventDefault();
    e.stopPropagation();
    switch (e.key) {
      case " ":
        handlers.handlePlayPause();
        break;
      case "ArrowLeft":
        handlers.handleTimeBackward();
        break;
      case "ArrowRight":
        handlers.handleTimeForward();
        break;
      case "ArrowUp":
        handleAdjustVolume(5);
        break;
      case "ArrowDown":
        handleAdjustVolume(-5);
        break;
      case "PageUp":
        handlers.handleTrackBackward();
        break;
      case "PageDown":
        handlers.handleTrackForward();
        break;
      case "f":
        handlers.toggleFullscreenMode();
        break;
      case "m":
        handlers.handleMuteToggle();
        break;
    }
  };

  document.addEventListener("keydown", handleKeydown);
  logger(CPL.INFO, getString("INFO__HOTKEYS__REGISTERED"));

  return () => {
    document.removeEventListener("keydown", handleKeydown);
  };
};
