export const PLUME_CONSTANTS = {
  SPA_REINIT_DELAY_MS: 1000, // delay before reinitializing after SPA navigation
  TRACK_DISPLAY_UPDATE_DELAY_MS: 500, // delay for track display refresh after navigation
  AUDIO_RETRY_MS: 1000, // delay before retrying audio element lookup
  AUDIO_RETRY_TOAST_THRESHOLD: 3, // show toast after this many failed audio retries
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
  if (value < min || value > max) throw new RangeError(`${value} is out of range (${min}–${max})`);
}

export const SEEK_JUMP_DURATION_MIN = 1 as WholeNumber;
export const SEEK_JUMP_DURATION_MAX = 300 as WholeNumber;
export const VOLUME_HOTKEY_STEP_MIN = 1 as WholeNumber;
export const VOLUME_HOTKEY_STEP_MAX = 20 as WholeNumber;
export const isValidVolume = (volume: number): boolean => Number.isFinite(volume) && volume >= 0 && volume <= 1;
export const TRACK_RESTART_THRESHOLD_MIN = 0 as WholeNumber;
export const TRACK_RESTART_THRESHOLD_MAX = 10 as WholeNumber;

export const PLAYBACK_SPEED_STEPS: readonly number[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];
export const PLAYBACK_SPEED_DEFAULT = 1 as const;
export const PLAYBACK_SPEED_MIN = PLAYBACK_SPEED_STEPS[0];
export const PLAYBACK_SPEED_MAX = PLAYBACK_SPEED_STEPS[PLAYBACK_SPEED_STEPS.length - 1];
export const PLAYBACK_SPEED_SAFARI_MIN = 0.5 as const;
export const PLAYBACK_SPEED_SAFARI_MAX = 2.0 as const;
export const isValidPlaybackSpeed = (speed: number): boolean =>
  Number.isFinite(speed) && speed >= PLAYBACK_SPEED_MIN && speed <= PLAYBACK_SPEED_MAX;

// Finds the nearest valid speed tick, or returns the exact value if it's already a tick.
export const speedToSliderPosition = (speed: number): number => {
  const idx = PLAYBACK_SPEED_STEPS.indexOf(speed);
  if (idx !== -1) return idx;

  for (let i = 0; i < PLAYBACK_SPEED_STEPS.length - 1; i++) {
    const lo = PLAYBACK_SPEED_STEPS[i] as number;
    const hi = PLAYBACK_SPEED_STEPS[i + 1] as number;
    if (speed > lo && speed < hi) {
      return i + (speed - lo) / (hi - lo);
    }
  }
  return speed <= (PLAYBACK_SPEED_STEPS[0] as number) ? 0 : PLAYBACK_SPEED_STEPS.length - 1;
};

// Returns the value rounded to 2 decimal places, or null if out of range or non-numeric.
export const parseCustomPlaybackSpeed = (raw: string): number | null => {
  const trimmedValue = raw.trim();
  if (trimmedValue === "") return null;

  const value = parseFloat(trimmedValue);
  return isValidPlaybackSpeed(value) ? Math.round(value * 100) / 100 : null;
};

export const PLUME_DEFAULTS = {
  language: PLUME_SUPPORTED_LANGUAGES[0],
  durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION,
  trackRestartThreshold: 5 as WholeNumber, // in seconds
  seekJumpDuration: 10 as WholeNumber, // in seconds
  loopMode: LOOP_MODE.NONE,
  savedVolume: 50 / PLUME_CONSTANTS.VOLUME_SLIDER_GRANULARITY, // normalized 0–1
  volumeHotkeyStep: 5 as WholeNumber, // in percent
  playbackSpeed: PLAYBACK_SPEED_DEFAULT,
  featureFlags: {
    goToTrack: true,
    tracklist: true,
    loopModes: true,
    fullscreen: true,
    quickSeek: true,
    runtime: true,
    speedControl: true,
  } as const,
} as const;

export interface TimeState {
  currentTime: number;
  duration: number;
  durationDisplayMethod: TimeDisplayMethodType;
}

export type FeatureFlags = {
  goToTrack: boolean;
  tracklist: boolean;
  loopModes: boolean;
  fullscreen: boolean;
  quickSeek: boolean;
  runtime: boolean;
  speedControl: boolean;
};
export type FeatureFlagKey = keyof FeatureFlags;
