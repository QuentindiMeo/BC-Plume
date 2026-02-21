import { IAction, IListener, IStore } from "../domain/store";

export interface Gui {
  audioElement: HTMLAudioElement | null;
  titleDisplay: HTMLDivElement | null;
  progressSlider: HTMLInputElement | null;
  elapsedDisplay: HTMLSpanElement | null;
  durationDisplay: HTMLSpanElement | null;
  volumeSlider: HTMLInputElement | null;
  muteBtn: HTMLButtonElement | null;
}

/**
 * Type representing a fully initialized Plume instance where all DOM elements are guaranteed to be non-null.
 * Use this type after initialization is complete to avoid null checks.
 */
export interface DefinedGui {
  audioElement: HTMLAudioElement;
  titleDisplay: HTMLDivElement;
  progressSlider: HTMLInputElement;
  elapsedDisplay: HTMLSpanElement;
  durationDisplay: HTMLSpanElement;
  volumeSlider: HTMLInputElement;
  muteBtn: HTMLButtonElement;
}

export enum GUI_ACTIONS {
  RESET_GUI_INSTANCE = "resetGuiInstance",
  SET_AUDIO_ELEMENT = "setAudioElement",
  SET_TITLE_DISPLAY = "setTitleDisplay",
  SET_PROGRESS_SLIDER = "setProgressSlider",
  SET_ELAPSED_DISPLAY = "setElapsedDisplay",
  SET_DURATION_DISPLAY = "setDurationDisplay",
  SET_VOLUME_SLIDER = "setVolumeSlider",
  SET_MUTE_BTN = "setMuteBtn",
}

export type GuiAction =
  | IAction<GUI_ACTIONS.RESET_GUI_INSTANCE, string | null>
  | IAction<GUI_ACTIONS.SET_AUDIO_ELEMENT, HTMLAudioElement | null>
  | IAction<GUI_ACTIONS.SET_TITLE_DISPLAY, HTMLDivElement | null>
  | IAction<GUI_ACTIONS.SET_PROGRESS_SLIDER, HTMLInputElement | null>
  | IAction<GUI_ACTIONS.SET_ELAPSED_DISPLAY, HTMLSpanElement | null>
  | IAction<GUI_ACTIONS.SET_DURATION_DISPLAY, HTMLSpanElement | null>
  | IAction<GUI_ACTIONS.SET_VOLUME_SLIDER, HTMLInputElement | null>
  | IAction<GUI_ACTIONS.SET_MUTE_BTN, HTMLButtonElement | null>;

export interface IGuiActions {
  resetGuiInstance: (reason?: string | null) => GuiAction;
  setAudioElement: (element: HTMLAudioElement | null) => GuiAction;
  setTitleDisplay: (element: HTMLDivElement | null) => GuiAction;
  setProgressSlider: (element: HTMLInputElement | null) => GuiAction;
  setElapsedDisplay: (element: HTMLSpanElement | null) => GuiAction;
  setDurationDisplay: (element: HTMLSpanElement | null) => GuiAction;
  setVolumeSlider: (element: HTMLInputElement | null) => GuiAction;
  setMuteBtn: (element: HTMLButtonElement | null) => GuiAction;
}

export type GuiListener<GuiProp extends keyof DefinedGui = keyof DefinedGui> = IListener<DefinedGui, GuiProp>;

export interface IGui extends IStore<DefinedGui, GuiAction> {}
