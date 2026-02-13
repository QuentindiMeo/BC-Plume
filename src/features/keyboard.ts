import { PLUME_CONSTANTS, PLUME_ELEM_IDENTIFIERS } from "../domain/plume";
import { getPlumeUiInstance } from "../infra/AppInstanceImpl";
import { getStoreInstance, STORE_ACTION_TYPES } from "../infra/AppStoreImpl";
import type { CleanupCallback } from "../types";
import { getString } from "./i18n";
import { CPL, logger } from "./logger";

const { AVAILABLE_HOTKEY_CODES, VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

interface KeyboardHandlers {
  handlePlayPause: Function;
  handleTimeBackward: Function;
  handleTimeForward: Function;
  handleTrackBackward: Function;
  handleTrackForward: Function;
  toggleFullscreenMode: Function;
}

export function setupHotkeys(handlers: KeyboardHandlers): CleanupCallback {
  const plumeUi = getPlumeUiInstance();
  const store = getStoreInstance();

  const handleAdjustVolume = (delta: number) => {
    const plume = plumeUi.getState();
    const currentValue = Number.parseInt(plume.volumeSlider.value);
    const newValue = Math.max(0, Math.min(VOLUME_SLIDER_GRANULARITY, currentValue + delta));
    plume.volumeSlider.value = newValue.toString();

    const volume = newValue / VOLUME_SLIDER_GRANULARITY;
    plume.audioElement.volume = volume;

    const volumeSliders = document.querySelectorAll(PLUME_ELEM_IDENTIFIERS.volumeSlider);
    volumeSliders.forEach((slider) => {
      (slider as HTMLInputElement).value = newValue.toString();

      const valueDisplay = slider.parentElement!.querySelector(PLUME_ELEM_IDENTIFIERS.volumeValue) as HTMLDivElement;
      valueDisplay.textContent = `${newValue}${getString("META__PERCENTAGE")}`;
    });

    store.dispatch({ type: STORE_ACTION_TYPES.SET_VOLUME, payload: volume });
  };

  const handleToggleMute = () => {
    const plume = plumeUi.getState();
    plume.muteBtn.click();
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (!(e.ctrlKey && e.altKey)) return; // require Ctrl + Alt modifier

    const isValidHotkey = AVAILABLE_HOTKEY_CODES.has(e.code);
    if (!isValidHotkey) return;

    e.preventDefault();
    e.stopPropagation();

    switch (e.code) {
      case "Space":
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
      case "KeyF":
        handlers.toggleFullscreenMode();
        break;
      case "KeyM":
        handleToggleMute();
        break;
    }
  };

  document.addEventListener("keydown", handleKeydown);
  logger(CPL.INFO, getString("INFO__HOTKEYS__REGISTERED"));

  return () => {
    document.removeEventListener("keydown", handleKeydown);
  };
}
