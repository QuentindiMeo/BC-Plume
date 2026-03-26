import { HotkeyAction, KeyBinding } from "../../domain/hotkeys";
import { PLUME_CONSTANTS } from "../../domain/plume";
import { coreActions } from "../../domain/ports/app-core";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { PLUME_MESSAGE_TYPE } from "../../shared/messages";
import { NoArgFunction } from "../../shared/types";
import { getMessageReceiverInstance, getMusicPlayerInstance } from "../stores/adapters";
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
  handleLoopCycle: NoArgFunction;
}

// e.code values for both digit row and numpad
const DIGIT_CODES = new Set<string>(Array.from({ length: 10 }, (_, i) => [`Digit${i}`, `Numpad${i}`]).flat());

// Maps a KeyBinding's code to a HotkeyAction for fast reverse lookup
const buildCodeToActionMap = (bindings: Record<HotkeyAction, KeyBinding>): Map<string, HotkeyAction> => {
  const map = new Map<string, HotkeyAction>();
  for (const [action, binding] of Object.entries(bindings)) {
    map.set(binding.code, action as HotkeyAction);
  }
  return map;
};

export const setupHotkeys = (
  handlers: KeyboardHandlers,
  initialBindings: Record<HotkeyAction, KeyBinding>
): CleanupCallback => {
  const appCore = getAppCoreInstance();

  let currentBindings = { ...initialBindings };
  let codeToAction = buildCodeToActionMap(currentBindings);

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
    if (userIsTypingInInput) return;

    if (DIGIT_CODES.has(e.code)) {
      if (!e.getModifierState("NumLock") && e.code.startsWith("Numpad")) return;

      e.preventDefault();
      e.stopPropagation();

      const musicPlayer = getMusicPlayerInstance();
      const pressedKey = e.code.replace("Digit", "").replace("Numpad", "");
      const digit = parseInt(pressedKey, 10);
      seekToProgress(digit * 0.1 * PROGRESS_SLIDER_GRANULARITY, appCore, musicPlayer);

      return;
    }

    const action = codeToAction.get(e.code);
    if (!action) return;

    e.preventDefault();
    e.stopPropagation();

    switch (action) {
      case HotkeyAction.PLAY_PAUSE: {
        const focusedElement = document.activeElement as HTMLElement;
        if (focusedElement.tagName === "BUTTON") {
          focusedElement.click();
          return;
        }
        handlers.handlePlayPause();
        break;
      }
      case HotkeyAction.TIME_BACKWARD:
        handlers.handleTimeBackward();
        break;
      case HotkeyAction.TIME_FORWARD:
        handlers.handleTimeForward();
        break;
      case HotkeyAction.VOLUME_UP: {
        const volumeHotkeyStep = appCore.getState().volumeHotkeyStep;
        handleAdjustVolume(volumeHotkeyStep);
        break;
      }
      case HotkeyAction.VOLUME_DOWN: {
        const volumeHotkeyStep = appCore.getState().volumeHotkeyStep * -1;
        handleAdjustVolume(volumeHotkeyStep);
        break;
      }
      case HotkeyAction.TRACK_BACKWARD:
        handlers.handleTrackBackward();
        break;
      case HotkeyAction.TRACK_FORWARD:
        handlers.handleTrackForward();
        break;
      case HotkeyAction.FULLSCREEN:
        handlers.toggleFullscreenMode();
        break;
      case HotkeyAction.MUTE:
        handlers.handleMuteToggle();
        break;
      case HotkeyAction.LOOP_CYCLE:
        handlers.handleLoopCycle();
        break;
      default:
        action satisfies never; // Ensure all cases are handled
        logger(CPL.ERROR, getString("ERROR__HOTKEYS__UNHANDLED_ACTION", [action as string]));
    }
  };

  document.addEventListener("keydown", handleKeydown);

  const messageReceiver = getMessageReceiverInstance();
  const unsubscribeMessages = messageReceiver.onMessage((message) => {
    if (message.type === PLUME_MESSAGE_TYPE.HOTKEYS_UPDATED) {
      currentBindings = { ...message.bindings };
      codeToAction = buildCodeToActionMap(currentBindings);
    } else if (message.type === PLUME_MESSAGE_TYPE.SEEK_JUMP_DURATION_UPDATED) {
      appCore.dispatch(coreActions.setSeekJumpDuration(message.seekJumpDuration));
    } else if (message.type === PLUME_MESSAGE_TYPE.VOLUME_HOTKEY_STEP_UPDATED) {
      appCore.dispatch(coreActions.setVolumeStep(message.volumeHotkeyStep));
    } else if (message.type === PLUME_MESSAGE_TYPE.TRACK_RESTART_THRESHOLD_UPDATED) {
      appCore.dispatch(coreActions.setTrackRestartThreshold(message.trackRestartThreshold));
    }
  });

  logger(CPL.INFO, getString("INFO__HOTKEYS__REGISTERED"));

  return () => {
    document.removeEventListener("keydown", handleKeydown);
    unsubscribeMessages();
  };
};
