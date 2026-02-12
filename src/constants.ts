export const APP_NAME = "Plume - Bandcamp Player Enhancer";
export const APP_VERSION = "v1.3.1";
export const PLUME_KO_FI_URL = "https://ko-fi.com/quentindimeo";

export const PLUME_DEF = {
  savedVolume: 0.5,
} as const;

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
