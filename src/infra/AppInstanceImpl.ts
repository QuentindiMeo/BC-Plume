import { Action, handleUnknownAction, Listener, Store } from "../domain/store";
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
export interface DefinedPlumeCore {
  audioElement: HTMLAudioElement;
  titleDisplay: HTMLDivElement;
  progressSlider: HTMLInputElement;
  elapsedDisplay: HTMLSpanElement;
  durationDisplay: HTMLSpanElement;
  volumeSlider: HTMLInputElement;
  muteBtn: HTMLButtonElement;
}

enum PLUME_ACTIONS {
  RESET_PLUME_UI_INSTANCE = "resetPlumeUiInstance",
  SET_AUDIO_ELEMENT = "setAudioElement",
  SET_TITLE_DISPLAY = "setTitleDisplay",
  SET_PROGRESS_SLIDER = "setProgressSlider",
  SET_ELAPSED_DISPLAY = "setElapsedDisplay",
  SET_DURATION_DISPLAY = "setDurationDisplay",
  SET_VOLUME_SLIDER = "setVolumeSlider",
  SET_MUTE_BTN = "setMuteBtn",
}

export type PlumeAction =
  | Action<PLUME_ACTIONS.RESET_PLUME_UI_INSTANCE, string | null>
  | Action<PLUME_ACTIONS.SET_AUDIO_ELEMENT, HTMLAudioElement | null>
  | Action<PLUME_ACTIONS.SET_TITLE_DISPLAY, HTMLDivElement | null>
  | Action<PLUME_ACTIONS.SET_PROGRESS_SLIDER, HTMLInputElement | null>
  | Action<PLUME_ACTIONS.SET_ELAPSED_DISPLAY, HTMLSpanElement | null>
  | Action<PLUME_ACTIONS.SET_DURATION_DISPLAY, HTMLSpanElement | null>
  | Action<PLUME_ACTIONS.SET_VOLUME_SLIDER, HTMLInputElement | null>
  | Action<PLUME_ACTIONS.SET_MUTE_BTN, HTMLButtonElement | null>;

export const plumeActions = {
  resetPlumeUiInstance: (reason: string | null = null): PlumeAction => ({
    type: PLUME_ACTIONS.RESET_PLUME_UI_INSTANCE,
    payload: reason,
  }),
  setAudioElement: (element: HTMLAudioElement | null): PlumeAction => ({
    type: PLUME_ACTIONS.SET_AUDIO_ELEMENT,
    payload: element,
  }),
  setTitleDisplay: (element: HTMLDivElement | null): PlumeAction => ({
    type: PLUME_ACTIONS.SET_TITLE_DISPLAY,
    payload: element,
  }),
  setProgressSlider: (element: HTMLInputElement | null): PlumeAction => ({
    type: PLUME_ACTIONS.SET_PROGRESS_SLIDER,
    payload: element,
  }),
  setElapsedDisplay: (element: HTMLSpanElement | null): PlumeAction => ({
    type: PLUME_ACTIONS.SET_ELAPSED_DISPLAY,
    payload: element,
  }),
  setDurationDisplay: (element: HTMLSpanElement | null): PlumeAction => ({
    type: PLUME_ACTIONS.SET_DURATION_DISPLAY,
    payload: element,
  }),
  setVolumeSlider: (element: HTMLInputElement | null): PlumeAction => ({
    type: PLUME_ACTIONS.SET_VOLUME_SLIDER,
    payload: element,
  }),
  setMuteBtn: (element: HTMLButtonElement | null): PlumeAction => ({
    type: PLUME_ACTIONS.SET_MUTE_BTN,
    payload: element,
  }),
} as const;

export type PlumeStateListener<K extends keyof DefinedPlumeCore = keyof DefinedPlumeCore> = Listener<
  DefinedPlumeCore,
  K
>;

interface AppInstance extends Store<DefinedPlumeCore, PlumeAction> {
  subscribe<K extends keyof DefinedPlumeCore>(key: K, listener: PlumeStateListener<K>): () => void;
  subscribeAll(listener: (state: DefinedPlumeCore) => void): () => void;
}

const INITIAL_STATE: PlumeCore = {
  audioElement: null,
  titleDisplay: null,
  progressSlider: null,
  elapsedDisplay: null,
  durationDisplay: null,
  volumeSlider: null,
  muteBtn: null,
};

let plumeUiInstance: AppInstance | null = null;

const createPlumeUiInstance = (): AppInstance => {
  let state = { ...INITIAL_STATE };

  const listeners = new Map<keyof PlumeCore, Set<PlumeStateListener<any>>>();
  const globalListeners = new Set<(state: DefinedPlumeCore) => void>();

  const notify = <K extends keyof DefinedPlumeCore>(key: K, prevValue: DefinedPlumeCore[K]): void => {
    const keyListeners = listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach((listener) => {
        try {
          listener(state[key], prevValue);
        } catch (error) {
          logger(CPL.ERROR, "State listener failed", { key, error });
        }
      });
    }

    globalListeners.forEach((listener) => {
      try {
        listener(state as DefinedPlumeCore);
      } catch (error) {
        logger(CPL.ERROR, "Global state listener failed", error);
      }
    });
  };

  const updateState = <K extends keyof PlumeCore>(key: K, value: PlumeCore[K]): void => {
    const prevValue = state[key];

    if (prevValue === value) return;

    state = { ...state, [key]: value };

    notify(key, prevValue as DefinedPlumeCore[K]);
  };

  const reducer = (action: PlumeAction): void => {
    switch (action.type) {
      case PLUME_ACTIONS.RESET_PLUME_UI_INSTANCE:
        updateState("audioElement", null);
        updateState("titleDisplay", null);
        updateState("progressSlider", null);
        updateState("elapsedDisplay", null);
        updateState("durationDisplay", null);
        updateState("volumeSlider", null);
        updateState("muteBtn", null);
        break;
      case PLUME_ACTIONS.SET_AUDIO_ELEMENT:
        updateState("audioElement", action.payload);
        break;
      case PLUME_ACTIONS.SET_TITLE_DISPLAY:
        updateState("titleDisplay", action.payload);
        break;
      case PLUME_ACTIONS.SET_PROGRESS_SLIDER:
        updateState("progressSlider", action.payload);
        break;
      case PLUME_ACTIONS.SET_ELAPSED_DISPLAY:
        updateState("elapsedDisplay", action.payload);
        break;
      case PLUME_ACTIONS.SET_DURATION_DISPLAY:
        updateState("durationDisplay", action.payload);
        break;
      case PLUME_ACTIONS.SET_VOLUME_SLIDER:
        updateState("volumeSlider", action.payload);
        break;
      case PLUME_ACTIONS.SET_MUTE_BTN:
        updateState("muteBtn", action.payload);
        break;
      default:
        action satisfies never; // Ensure declared all action types are handled
        handleUnknownAction(action);
    }
  };

  return {
    getState(): Readonly<DefinedPlumeCore> {
      return state as DefinedPlumeCore;
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

    subscribeAll(listener: (state: DefinedPlumeCore) => void): () => void {
      globalListeners.add(listener);

      return () => {
        globalListeners.delete(listener);
      };
    },
  };
};

export const getPlumeUiInstance = (): AppInstance => {
  plumeUiInstance ??= createPlumeUiInstance();
  return plumeUiInstance;
};
