import { PlumeCore, TIME_DISPLAY_METHOD } from "./types";

export const APP_NAME = "Plume - Bandcamp Player Enhancer";
export const APP_VERSION = "v1.3.1";
export const PLUME_KO_FI_URL = "https://ko-fi.com/quentindimeo";

export const PLUME_DEF: Pick<PlumeCore, "durationDisplayMethod" | "savedVolume" | "playerVolume"> = {
  durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION,
  savedVolume: 0.5,
  playerVolume: 0.5,
};

export const PLUME_CONSTANTS = {
  TIME_BEFORE_RESTART: 5,
  AVAILABLE_SHORTCUT_CODES: new Set([
    "Space",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "PageUp",
    "PageDown",
    "KeyF",
    "KeyM",
  ]),
};
