import { DefinedGui, Gui, GUI_ACTIONS, GuiAction, GuiListener, IGui, IGuiActions } from "../../infra/Gui";
import { CPL, logger } from "../../shared/logger";
import { handleUnknownAction } from "./shared";

export const guiActions: IGuiActions = {
  resetGuiInstance: (reason: string | null = null): GuiAction => ({
    type: GUI_ACTIONS.RESET_GUI_INSTANCE,
    payload: reason,
  }),
  setAudioElement: (element: HTMLAudioElement | null): GuiAction => ({
    type: GUI_ACTIONS.SET_AUDIO_ELEMENT,
    payload: element,
  }),
  setTitleDisplay: (element: HTMLDivElement | null): GuiAction => ({
    type: GUI_ACTIONS.SET_TITLE_DISPLAY,
    payload: element,
  }),
  setProgressSlider: (element: HTMLInputElement | null): GuiAction => ({
    type: GUI_ACTIONS.SET_PROGRESS_SLIDER,
    payload: element,
  }),
  setElapsedDisplay: (element: HTMLSpanElement | null): GuiAction => ({
    type: GUI_ACTIONS.SET_ELAPSED_DISPLAY,
    payload: element,
  }),
  setDurationDisplay: (element: HTMLSpanElement | null): GuiAction => ({
    type: GUI_ACTIONS.SET_DURATION_DISPLAY,
    payload: element,
  }),
  setVolumeSlider: (element: HTMLInputElement | null): GuiAction => ({
    type: GUI_ACTIONS.SET_VOLUME_SLIDER,
    payload: element,
  }),
  setMuteBtn: (element: HTMLButtonElement | null): GuiAction => ({
    type: GUI_ACTIONS.SET_MUTE_BTN,
    payload: element,
  }),
} as const;

const INITIAL_STATE: Gui = {
  audioElement: null,
  titleDisplay: null,
  progressSlider: null,
  elapsedDisplay: null,
  durationDisplay: null,
  volumeSlider: null,
  muteBtn: null,
};

const createGuiInstance = (): IGui => {
  let state = { ...INITIAL_STATE };

  const listeners = new Map<keyof Gui, Set<GuiListener<any>>>();
  const globalListeners = new Set<(state: DefinedGui) => void>();

  const notify = <GuiProp extends keyof DefinedGui>(key: GuiProp, prevValue: DefinedGui[GuiProp]): void => {
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
        listener(state as DefinedGui);
      } catch (error) {
        logger(CPL.ERROR, "Global state listener failed", error);
      }
    });
  };

  const updateState = <GuiProp extends keyof Gui>(key: GuiProp, value: Gui[GuiProp]): void => {
    const prevValue = state[key];

    if (prevValue === value) return;

    state = { ...state, [key]: value };

    notify(key, prevValue as DefinedGui[GuiProp]);
  };

  const reducer = (action: GuiAction): void => {
    switch (action.type) {
      case GUI_ACTIONS.RESET_GUI_INSTANCE:
        updateState("audioElement", null);
        updateState("titleDisplay", null);
        updateState("progressSlider", null);
        updateState("elapsedDisplay", null);
        updateState("durationDisplay", null);
        updateState("volumeSlider", null);
        updateState("muteBtn", null);
        break;
      case GUI_ACTIONS.SET_AUDIO_ELEMENT:
        updateState("audioElement", action.payload);
        break;
      case GUI_ACTIONS.SET_TITLE_DISPLAY:
        updateState("titleDisplay", action.payload);
        break;
      case GUI_ACTIONS.SET_PROGRESS_SLIDER:
        updateState("progressSlider", action.payload);
        break;
      case GUI_ACTIONS.SET_ELAPSED_DISPLAY:
        updateState("elapsedDisplay", action.payload);
        break;
      case GUI_ACTIONS.SET_DURATION_DISPLAY:
        updateState("durationDisplay", action.payload);
        break;
      case GUI_ACTIONS.SET_VOLUME_SLIDER:
        updateState("volumeSlider", action.payload);
        break;
      case GUI_ACTIONS.SET_MUTE_BTN:
        updateState("muteBtn", action.payload);
        break;
      default:
        action satisfies never; // Ensure declared all action types are handled
        handleUnknownAction(action);
    }
  };

  return {
    getState(): Readonly<DefinedGui> {
      return state as DefinedGui;
    },

    dispatch(action: GuiAction): void {
      reducer(action);
    },

    subscribe<GuiProp extends keyof DefinedGui>(key: GuiProp, listener: GuiListener<GuiProp>): () => void {
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

    subscribeAll(listener: (state: DefinedGui) => void): () => void {
      globalListeners.add(listener);

      return () => {
        globalListeners.delete(listener);
      };
    },
  };
};

let guiInstance: IGui | null = null;
export const getGuiInstance = (): IGui => {
  guiInstance ??= createGuiInstance();
  return guiInstance;
};
