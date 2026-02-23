import { PLUME_CONSTANTS } from "../../domain/plume";
import { coreActions } from "../../domain/ports/app-core";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { NoArgFunction } from "../../shared/types";
import { getAppCoreInstance } from "../stores/AppCoreImpl";
import type { CleanupCallback } from "./types";

const { VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

interface KeyboardHandlers {
  handlePlayPause: NoArgFunction;
  handleTimeBackward: NoArgFunction;
  handleTimeForward: NoArgFunction;
  handleTrackBackward: NoArgFunction;
  handleTrackForward: NoArgFunction;
  handleMuteToggle: NoArgFunction;
  toggleFullscreenMode: NoArgFunction;
}

const AVAILABLE_HOTKEYS = new Set<string>([
  " ",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "f",
  "m",
]);

export const setupHotkeys = (handlers: KeyboardHandlers): CleanupCallback => {
  const appCore = getAppCoreInstance();

  const handleAdjustVolume = (delta: number) => {
    if (delta === 0) logger(CPL.WARN, getString("WARN__VOLUME__ADJUSTING_WITH_NULL_DELTA"));

    const currentVolume = appCore.getState().volume;
    const currentValue = Math.round(currentVolume * VOLUME_SLIDER_GRANULARITY);
    const newValue = Math.max(0, Math.min(VOLUME_SLIDER_GRANULARITY, currentValue + delta));

    appCore.dispatch(coreActions.setVolume(newValue / VOLUME_SLIDER_GRANULARITY));
  };

  const handleKeydown = (e: KeyboardEvent) => {
    const userIsTypingInInput =
      (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) && !e.target.readOnly;
    if (userIsTypingInInput) return; // don't trigger hotkeys when user is typing in an input or textarea

    const isValidHotkey = AVAILABLE_HOTKEYS.has(e.key);
    if (!isValidHotkey) return;

    e.preventDefault();
    e.stopPropagation();
    switch (e.key) {
      case " ": {
        const focusedElement = document.activeElement as HTMLElement;
        const isSpaceTriggeringButton = focusedElement.tagName === "BUTTON";
        if (isSpaceTriggeringButton) {
          focusedElement.click();
          return;
        }
        handlers.handlePlayPause();
        break;
      }
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
