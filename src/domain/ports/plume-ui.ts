import { IAction, IStore } from "../store";

export interface Gui {
  // Plume's own UI elements registered after injection
  plumeContainer: HTMLDivElement | null;
  headerLogo: HTMLAnchorElement | null;
  audioElement: HTMLAudioElement | null;
  titleDisplay: HTMLDivElement | null;
  progressSlider: HTMLInputElement | null;
  elapsedDisplay: HTMLSpanElement | null;
  durationDisplay: HTMLSpanElement | null;
  // Arrays for elements that exist in both main and fullscreen views
  playPauseBtns: HTMLButtonElement[];
  trackFwdBtns: HTMLButtonElement[];
  loopBtns: HTMLButtonElement[];
  volumeSlider: HTMLInputElement | null;
  muteBtn: HTMLButtonElement | null;

  fullscreenOverlay: HTMLDivElement | null;

  hiddenBcTable: HTMLTableElement | null;
}

/**
 * Type representing a fully initialized Plume instance where all DOM elements are guaranteed to be non-null.
 * Use this type after initialization is complete to avoid null checks.
 */
export interface DefinedGui {
  plumeContainer: HTMLDivElement;
  headerLogo: HTMLAnchorElement;
  audioElement: HTMLAudioElement;
  titleDisplay: HTMLDivElement;
  progressSlider: HTMLInputElement;
  elapsedDisplay: HTMLSpanElement;
  durationDisplay: HTMLSpanElement;
  playPauseBtns: HTMLButtonElement[];
  trackFwdBtns: HTMLButtonElement[];
  loopBtns: HTMLButtonElement[];
  volumeSlider: HTMLInputElement;
  muteBtn: HTMLButtonElement;

  fullscreenOverlay: HTMLDivElement | null;

  hiddenBcTable: HTMLTableElement | null;
}

export enum GUI_ACTIONS {
  SET_PLUME_CONTAINER = "setPlumeContainer",
  SET_HEADER_LOGO = "setHeaderLogo",
  RESET_GUI_INSTANCE = "resetGuiInstance",
  SET_AUDIO_ELEMENT = "setAudioElement",
  SET_TITLE_DISPLAY = "setTitleDisplay",
  SET_PROGRESS_SLIDER = "setProgressSlider",
  SET_ELAPSED_DISPLAY = "setElapsedDisplay",
  SET_DURATION_DISPLAY = "setDurationDisplay",
  SET_PLAY_PAUSE_BTNS = "setPlayPauseBtns",
  SET_TRACK_FWD_BTNS = "setTrackFwdBtns",
  SET_LOOP_BTNS = "setLoopBtns",
  SET_VOLUME_SLIDER = "setVolumeSlider",
  SET_MUTE_BTN = "setMuteBtn",
  SET_FULLSCREEN_OVERLAY = "setFullscreenOverlay",
  SET_HIDDEN_BC_TABLE = "setHiddenBcTable",
}

export type GuiAction =
  | IAction<GUI_ACTIONS.SET_PLUME_CONTAINER, HTMLDivElement | null>
  | IAction<GUI_ACTIONS.SET_HEADER_LOGO, HTMLAnchorElement | null>
  | IAction<GUI_ACTIONS.RESET_GUI_INSTANCE, string | null>
  | IAction<GUI_ACTIONS.SET_AUDIO_ELEMENT, HTMLAudioElement | null>
  | IAction<GUI_ACTIONS.SET_TITLE_DISPLAY, HTMLDivElement | null>
  | IAction<GUI_ACTIONS.SET_PROGRESS_SLIDER, HTMLInputElement | null>
  | IAction<GUI_ACTIONS.SET_ELAPSED_DISPLAY, HTMLSpanElement | null>
  | IAction<GUI_ACTIONS.SET_DURATION_DISPLAY, HTMLSpanElement | null>
  | IAction<GUI_ACTIONS.SET_PLAY_PAUSE_BTNS, HTMLButtonElement[]>
  | IAction<GUI_ACTIONS.SET_TRACK_FWD_BTNS, HTMLButtonElement[]>
  | IAction<GUI_ACTIONS.SET_LOOP_BTNS, HTMLButtonElement[]>
  | IAction<GUI_ACTIONS.SET_VOLUME_SLIDER, HTMLInputElement | null>
  | IAction<GUI_ACTIONS.SET_MUTE_BTN, HTMLButtonElement | null>
  | IAction<GUI_ACTIONS.SET_FULLSCREEN_OVERLAY, HTMLDivElement | null>
  | IAction<GUI_ACTIONS.SET_HIDDEN_BC_TABLE, HTMLTableElement | null>;

interface IGuiActions {
  resetGuiInstance: (reason?: string | null) => GuiAction;
  setPlumeContainer: (element: HTMLDivElement | null) => GuiAction;
  setHeaderLogo: (element: HTMLAnchorElement | null) => GuiAction;
  setAudioElement: (element: HTMLAudioElement | null) => GuiAction;
  setTitleDisplay: (element: HTMLDivElement | null) => GuiAction;
  setProgressSlider: (element: HTMLInputElement | null) => GuiAction;
  setElapsedDisplay: (element: HTMLSpanElement | null) => GuiAction;
  setDurationDisplay: (element: HTMLSpanElement | null) => GuiAction;
  setPlayPauseBtns: (buttons: HTMLButtonElement[]) => GuiAction;
  setTrackFwdBtns: (buttons: HTMLButtonElement[]) => GuiAction;
  setLoopBtns: (buttons: HTMLButtonElement[]) => GuiAction;
  setVolumeSlider: (element: HTMLInputElement | null) => GuiAction;
  setMuteBtn: (element: HTMLButtonElement | null) => GuiAction;
  setFullscreenOverlay: (element: HTMLDivElement | null) => GuiAction;
  setHiddenBcTable: (element: HTMLTableElement | null) => GuiAction;
}
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
  setLoopBtns: (buttons: HTMLButtonElement[]): GuiAction => ({
    type: GUI_ACTIONS.SET_LOOP_BTNS,
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

export interface IGui extends IStore<DefinedGui, GuiAction> {}
