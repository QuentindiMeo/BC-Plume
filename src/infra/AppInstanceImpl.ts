/**
 * Plume Instance Management
 *
 * Manages the DOM element references for the Plume player UI.
 * This module provides a centralized instance that holds references to
 * all key DOM elements in the enhanced player interface.
 */

import { Action, handleUnknownAction, Listener, Store } from "../domain/store";
import { getString } from "../features/i18n";
import { CPL, logger } from "../features/logger";

interface PlumeCore {
  audioElement: HTMLAudioElement | null;
  titleDisplay: HTMLDivElement | null;
  progressSlider: HTMLInputElement | null;
  elapsedDisplay: HTMLSpanElement | null;
  durationDisplay: HTMLSpanElement | null;
  volumeSlider: HTMLInputElement | null;
  muteBtn: HTMLButtonElement | null;
}

/**
 * Type representing a fully initialized plume instance where all DOM elements are guaranteed to be non-null.
 * Use this type after initialization is complete to avoid null checks.
 */
export interface InitializedPlumeCore {
  audioElement: HTMLAudioElement;
  titleDisplay: HTMLDivElement;
  progressSlider: HTMLInputElement;
  elapsedDisplay: HTMLSpanElement;
  durationDisplay: HTMLSpanElement;
  volumeSlider: HTMLInputElement;
  muteBtn: HTMLButtonElement;
}

export enum PLUME_ACTION_TYPES {
  RESET_PLUME_INSTANCE = "resetPlumeInstance",
  SET_AUDIO_ELEMENT = "setAudioElement",
  SET_TITLE_DISPLAY = "setTitleDisplay",
  SET_PROGRESS_SLIDER = "setProgressSlider",
  SET_ELAPSED_DISPLAY = "setElapsedDisplay",
  SET_DURATION_DISPLAY = "setDurationDisplay",
  SET_VOLUME_SLIDER = "setVolumeSlider",
  SET_MUTE_BTN = "setMuteBtn",
}

export type PlumeAction =
  | Action<PLUME_ACTION_TYPES.RESET_PLUME_INSTANCE, string | null>
  | Action<PLUME_ACTION_TYPES.SET_AUDIO_ELEMENT, HTMLAudioElement | null>
  | Action<PLUME_ACTION_TYPES.SET_TITLE_DISPLAY, HTMLDivElement | null>
  | Action<PLUME_ACTION_TYPES.SET_PROGRESS_SLIDER, HTMLInputElement | null>
  | Action<PLUME_ACTION_TYPES.SET_ELAPSED_DISPLAY, HTMLSpanElement | null>
  | Action<PLUME_ACTION_TYPES.SET_DURATION_DISPLAY, HTMLSpanElement | null>
  | Action<PLUME_ACTION_TYPES.SET_VOLUME_SLIDER, HTMLInputElement | null>
  | Action<PLUME_ACTION_TYPES.SET_MUTE_BTN, HTMLButtonElement | null>;

export type PlumeStateListener<K extends keyof InitializedPlumeCore = keyof InitializedPlumeCore> = Listener<
  InitializedPlumeCore,
  K
>;

interface AppInstance extends Store<InitializedPlumeCore, PlumeAction> {}

const INITIAL_STATE: PlumeCore = {
  audioElement: null,
  titleDisplay: null,
  progressSlider: null,
  elapsedDisplay: null,
  durationDisplay: null,
  volumeSlider: null,
  muteBtn: null,
};

let plumeInstance: AppInstance | null = null;

function createPlumeInstance(): AppInstance {
  let state = { ...INITIAL_STATE } as InitializedPlumeCore;

  const listeners = new Map<keyof PlumeCore, Set<PlumeStateListener<any>>>();
  const globalListeners = new Set<(state: InitializedPlumeCore) => void>();

  function notify<K extends keyof InitializedPlumeCore>(key: K, prevValue: InitializedPlumeCore[K]): void {
    const keyListeners = listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach((listener) => {
        try {
          listener(state[key], prevValue);
        } catch (error) {
          logger(CPL.ERROR, getString("ERROR__STATE__LISTENER_FAILED"), { key, error });
        }
      });
    }

    globalListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        logger(CPL.ERROR, getString("ERROR__STATE__GLOBAL_LISTENER_FAILED"), error);
      }
    });
  }

  function updateState<K extends keyof PlumeCore>(key: K, value: PlumeCore[K]): void {
    const prevValue = state[key];

    if (prevValue === value) return;

    state = { ...state, [key]: value };

    notify(key, prevValue);
  }

  function reducer(action: PlumeAction): void {
    switch (action.type) {
      case PLUME_ACTION_TYPES.RESET_PLUME_INSTANCE:
        updateState("audioElement", null);
        updateState("titleDisplay", null);
        updateState("progressSlider", null);
        updateState("elapsedDisplay", null);
        updateState("durationDisplay", null);
        updateState("volumeSlider", null);
        updateState("muteBtn", null);
        break;
      case PLUME_ACTION_TYPES.SET_AUDIO_ELEMENT:
        updateState("audioElement", action.payload);
        break;
      case PLUME_ACTION_TYPES.SET_TITLE_DISPLAY:
        updateState("titleDisplay", action.payload);
        break;
      case PLUME_ACTION_TYPES.SET_PROGRESS_SLIDER:
        updateState("progressSlider", action.payload);
        break;
      case PLUME_ACTION_TYPES.SET_ELAPSED_DISPLAY:
        updateState("elapsedDisplay", action.payload);
        break;
      case PLUME_ACTION_TYPES.SET_DURATION_DISPLAY:
        updateState("durationDisplay", action.payload);
        break;
      case PLUME_ACTION_TYPES.SET_VOLUME_SLIDER:
        updateState("volumeSlider", action.payload);
        break;
      case PLUME_ACTION_TYPES.SET_MUTE_BTN:
        updateState("muteBtn", action.payload);
        break;
      default:
        action satisfies never; // Ensure declared all action types are handled
        handleUnknownAction(action);
    }
  }

  return {
    getState(): Readonly<InitializedPlumeCore> {
      return state;
    },

    dispatch(action: PlumeAction): void {
      reducer(action);
    },

    subscribe<K extends keyof PlumeCore>(key: K, listener: PlumeStateListener<K>): () => void {
      if (!listeners.has(key)) listeners.set(key, new Set());

      listeners.get(key)!.add(listener);

      return () => {
        const keyListeners = listeners.get(key);
        if (keyListeners) {
          keyListeners.delete(listener);
          if (keyListeners.size === 0) {
            listeners.delete(key);
          }
        }
      };
    },

    subscribeAll(listener: (state: InitializedPlumeCore) => void): () => void {
      globalListeners.add(listener);

      return () => {
        globalListeners.delete(listener);
      };
    },
  };
}

export function getPlumeInstance(): AppInstance {
  plumeInstance ??= createPlumeInstance();
  return plumeInstance;
}
