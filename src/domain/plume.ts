export const PLUME_CONSTANTS = {
  SPA_REINIT_DELAY_MS: 1000, // delay before reinitializing after SPA navigation
  TRACK_DISPLAY_UPDATE_DELAY_MS: 500, // delay for track display refresh after navigation
  AUDIO_RETRY_MS: 1000, // delay before retrying audio element lookup
  LOGO_DEFAULT_VERTICAL_PADDING_REM: 1, // default vertical padding for the header logo
  LATIN_SINGLE_LINE_HEIGHT_PX: 19, // expected single-line height for Latin characters, used as baseline for title padding
  SEEK_PAUSE_GUARD_MS: 100, // delay before re-enabling play after seek
  PROGRESS_SLIDER_GRANULARITY: 1000, // use 1000 for better granularity: 1000s = 16m40s
  VOLUME_SLIDER_GRANULARITY: 100, // percentage
  TOAST_AUTO_DISMISS: 10, // seconds before auto-dismissing a toast
} as const;

export const PLUME_SUPPORTED_LANGUAGES = ["auto", "en", "es", "fr"] as const;
export type PlumeLanguage = (typeof PLUME_SUPPORTED_LANGUAGES)[number];

export enum LOOP_MODE {
  NONE = "none",
  COLLECTION = "collection",
  TRACK = "track",
}
export type LoopModeType = `${LOOP_MODE}`;
export const LOOP_MODE_CYCLE: readonly LoopModeType[] = [LOOP_MODE.NONE, LOOP_MODE.COLLECTION, LOOP_MODE.TRACK];

export enum TIME_DISPLAY_METHOD {
  DURATION = "duration",
  REMAINING = "remaining",
}
export type TimeDisplayMethodType = `${TIME_DISPLAY_METHOD}`;

export const INITIAL_TIME_DISPLAY = "0:00";

declare const __wholeNumberBrand: unique symbol;
export type WholeNumber = number & { readonly [__wholeNumberBrand]: true };
export function assertWholeNumber(value: number): asserts value is WholeNumber {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new RangeError(`Expected a whole number, got: ${value}`);
  }
}
export function assertBoundedInteger(value: number, min: WholeNumber, max: WholeNumber): asserts value is WholeNumber {
  assertWholeNumber(value);
  if (value < min || value > max) throw new RangeError("Out of range");
}

export const SEEK_JUMP_DURATION_MIN = 1 as WholeNumber;
export const SEEK_JUMP_DURATION_MAX = 300 as WholeNumber;
export const VOLUME_HOTKEY_STEP_MIN = 1 as WholeNumber;
export const VOLUME_HOTKEY_STEP_MAX = 20 as WholeNumber;
export const TRACK_RESTART_THRESHOLD_MIN = 0 as WholeNumber;
export const TRACK_RESTART_THRESHOLD_MAX = 10 as WholeNumber;

export const PLUME_DEFAULTS = {
  language: PLUME_SUPPORTED_LANGUAGES[0],
  durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION,
  trackRestartThreshold: 5 as WholeNumber, // in seconds
  seekJumpDuration: 10 as WholeNumber, // in seconds
  loopMode: LOOP_MODE.NONE,
  savedVolume: 0.5,
  volumeHotkeyStep: 5 as WholeNumber, // in percent
} as const;

export interface TimeState {
  currentTime: number;
  duration: number;
  durationDisplayMethod: TimeDisplayMethodType;
}
