export const PLUME_CONSTANTS = {
  TIME_BEFORE_RESTART: 5,
  PROGRESS_SLIDER_GRANULARITY: 1000, // use 1000 for better granularity: 1000s = 16m40s
  VOLUME_SLIDER_GRANULARITY: 100,
  AVAILABLE_HOTKEYS: new Set([" ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "f", "m"]),
} as const;

export const PLUME_DEFAULTS = {
  savedVolume: 0.5,
} as const;
