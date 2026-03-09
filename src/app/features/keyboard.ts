import { PLUME_CONSTANTS } from "../../domain/plume";
import { coreActions } from "../../domain/ports/app-core";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { NoArgFunction } from "../../shared/types";
import { getMusicPlayerInstance } from "../stores/adapters";
import { getAppCoreInstance } from "../stores/AppCoreImpl";
import { seekToProgress } from "../use-cases/seek-to-progress";
import type { CleanupCallback } from "./types";

const { VOLUME_SLIDER_GRANULARITY, PROGRESS_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

interface KeyboardHandlers {
  handlePlayPause: NoArgFunction;
  handleTimeBackward: NoArgFunction;
  handleTimeForward: NoArgFunction;
  handleTrackBackward: NoArgFunction;
  handleTrackForward: NoArgFunction;
  handleMuteToggle: NoArgFunction;
  toggleFullscreenMode: NoArgFunction;
}

// e.code values for both digit row and numpad
const DIGIT_CODES = new Set<string>(Array.from({ length: 10 }, (_, i) => [`Digit${i}`, `Numpad${i}`]).flat());

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
    if (userIsTypingInInput) return; // don't trigger hotkeys when focus is on an input or textarea

    const isHotkey = AVAILABLE_HOTKEYS.has(e.key) || DIGIT_CODES.has(e.code);
    if (!isHotkey) return;
    if (!e.getModifierState("NumLock") && e.code.startsWith("Numpad")) return; // ignore numpad hotkeys when NumLock is off

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
      default:
        if (DIGIT_CODES.has(e.code)) {
          const musicPlayer = getMusicPlayerInstance();
          // Digit row (Digit0–Digit9) and numpad (Numpad0–Numpad9): seek to 0%–90%.
          // Uses e.code, not e.key, so it works on any keyboard layout (AZERTY, QWERTY, etc.)
          const pressedKey = e.code.replace("Digit", "").replace("Numpad", "");
          const digit = parseInt(pressedKey, 10);
          seekToProgress(digit * 0.1 * PROGRESS_SLIDER_GRANULARITY, appCore, musicPlayer);
        }
        break;
    }
  };

  document.addEventListener("keydown", handleKeydown);
  logger(CPL.INFO, getString("INFO__HOTKEYS__REGISTERED"));

  return () => {
    document.removeEventListener("keydown", handleKeydown);
  };
};
