export const APP_NAME = "Plume - Bandcamp Player Enhancer";
export const APP_VERSION = "v1.3.1";
export const PLUME_KO_FI_URL = "https://ko-fi.com/quentindimeo";

export enum BROWSER_TYPE {
  CHROMIUM = "Chromium",
  FIREFOX = "Firefox",
}
export type BrowserType = `${BROWSER_TYPE}`;

export enum TIME_DISPLAY_METHOD {
  DURATION = "duration",
  REMAINING = "remaining",
}
export type TimeDisplayMethodType = `${TIME_DISPLAY_METHOD}`;

export interface PlumeCore {
  audioElement: HTMLAudioElement | null;
  titleDisplay: HTMLDivElement | null;
  progressSlider: HTMLInputElement | null;
  elapsedDisplay: HTMLSpanElement | null;
  durationDisplay: HTMLSpanElement | null;
  durationDisplayMethod: TimeDisplayMethodType;
  volumeSlider: HTMLInputElement | null;
  muteBtn: HTMLButtonElement | null;
  savedVolume: number;
  playerVolume: number;
}

export const PLUME_DEF: Pick<PlumeCore, "durationDisplayMethod" | "savedVolume" | "playerVolume"> = {
  durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION,
  savedVolume: 0.5,
  playerVolume: 0.5,
};

export const PLUME_CONSTANTS = {
  TIME_BEFORE_RESTART: 5,
};
