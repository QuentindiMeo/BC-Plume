import { Action, Listener, Store } from "../domain/store";

export interface PlumeCore {
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

export enum PLUME_ACTIONS {
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

export interface IPlumeActions {
  resetPlumeUiInstance: (reason?: string | null) => PlumeAction;
  setAudioElement: (element: HTMLAudioElement | null) => PlumeAction;
  setTitleDisplay: (element: HTMLDivElement | null) => PlumeAction;
  setProgressSlider: (element: HTMLInputElement | null) => PlumeAction;
  setElapsedDisplay: (element: HTMLSpanElement | null) => PlumeAction;
  setDurationDisplay: (element: HTMLSpanElement | null) => PlumeAction;
  setVolumeSlider: (element: HTMLInputElement | null) => PlumeAction;
  setMuteBtn: (element: HTMLButtonElement | null) => PlumeAction;
}

export type PlumeStateListener<PlumeCoreProp extends keyof DefinedPlumeCore = keyof DefinedPlumeCore> = Listener<
  DefinedPlumeCore,
  PlumeCoreProp
>;

export interface AppInstance extends Store<DefinedPlumeCore, PlumeAction> {}
