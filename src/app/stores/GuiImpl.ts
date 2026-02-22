import { DefinedGui, Gui, GUI_ACTIONS, GuiAction, IGui, IGuiActions } from "../../infra/Gui";
import { handleUnknownAction } from "./shared";

export const guiActions: IGuiActions = {
  resetGuiInstance: (reason: string | null = null): GuiAction => ({
    type: GUI_ACTIONS.RESET_GUI_INSTANCE,
    payload: reason,
  }),
  setPlumeContainer: (element: HTMLDivElement | null): GuiAction => ({
    type: GUI_ACTIONS.SET_PLUME_CONTAINER,
    payload: element,
  }),
  setHeaderLogo: (element: HTMLAnchorElement | null): GuiAction => ({
    type: GUI_ACTIONS.SET_HEADER_LOGO,
    payload: element,
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
  setPlayPauseBtns: (buttons: HTMLButtonElement[]): GuiAction => ({
    type: GUI_ACTIONS.SET_PLAY_PAUSE_BTNS,
    payload: buttons,
  }),
  setTrackFwdBtns: (buttons: HTMLButtonElement[]): GuiAction => ({
    type: GUI_ACTIONS.SET_TRACK_FWD_BTNS,
    payload: buttons,
  }),
  setVolumeSlider: (element: HTMLInputElement | null): GuiAction => ({
    type: GUI_ACTIONS.SET_VOLUME_SLIDER,
    payload: element,
  }),
  setMuteBtn: (element: HTMLButtonElement | null): GuiAction => ({
    type: GUI_ACTIONS.SET_MUTE_BTN,
    payload: element,
  }),
  setFullscreenOverlay: (element: HTMLDivElement | null): GuiAction => ({
    type: GUI_ACTIONS.SET_FULLSCREEN_OVERLAY,
    payload: element,
  }),
  setHiddenBcTable: (element: HTMLTableElement | null): GuiAction => ({
    type: GUI_ACTIONS.SET_HIDDEN_BC_TABLE,
    payload: element,
  }),
} as const;

const INITIAL_STATE: Gui = {
  plumeContainer: null,
  headerLogo: null,
  audioElement: null,
  titleDisplay: null,
  progressSlider: null,
  elapsedDisplay: null,
  durationDisplay: null,
  playPauseBtns: [],
  trackFwdBtns: [],
  volumeSlider: null,
  muteBtn: null,
  fullscreenOverlay: null,
  hiddenBcTable: null,
};

const createGuiInstance = (): IGui => {
  let state = { ...INITIAL_STATE };

  const updateState = <GuiProp extends keyof Gui>(key: GuiProp, value: Gui[GuiProp]): void => {
    const prevValue = state[key];

    if (prevValue === value) return;

    state = { ...state, [key]: value };
  };

  const reducer = (action: GuiAction): void => {
    switch (action.type) {
      case GUI_ACTIONS.RESET_GUI_INSTANCE:
        updateState("plumeContainer", null);
        updateState("headerLogo", null);
        updateState("audioElement", null);
        updateState("titleDisplay", null);
        updateState("progressSlider", null);
        updateState("elapsedDisplay", null);
        updateState("durationDisplay", null);
        updateState("playPauseBtns", []);
        updateState("trackFwdBtns", []);
        updateState("volumeSlider", null);
        updateState("muteBtn", null);
        updateState("fullscreenOverlay", null);
        updateState("hiddenBcTable", null);
        break;
      case GUI_ACTIONS.SET_PLUME_CONTAINER:
        updateState("plumeContainer", action.payload);
        break;
      case GUI_ACTIONS.SET_HEADER_LOGO:
        updateState("headerLogo", action.payload);
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
      case GUI_ACTIONS.SET_PLAY_PAUSE_BTNS:
        updateState("playPauseBtns", action.payload);
        break;
      case GUI_ACTIONS.SET_TRACK_FWD_BTNS:
        updateState("trackFwdBtns", action.payload);
        break;
      case GUI_ACTIONS.SET_VOLUME_SLIDER:
        updateState("volumeSlider", action.payload);
        break;
      case GUI_ACTIONS.SET_MUTE_BTN:
        updateState("muteBtn", action.payload);
        break;
      case GUI_ACTIONS.SET_FULLSCREEN_OVERLAY:
        updateState("fullscreenOverlay", action.payload);
        break;
      case GUI_ACTIONS.SET_HIDDEN_BC_TABLE:
        updateState("hiddenBcTable", action.payload);
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
  };
};

let guiInstance: IGui | null = null;
export const getGuiInstance = (): IGui => {
  guiInstance ??= createGuiInstance();
  return guiInstance;
};
