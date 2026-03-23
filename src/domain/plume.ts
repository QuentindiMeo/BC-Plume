export const PLUME_CONSTANTS = {
  SPA_REINIT_DELAY_MS: 1000, // delay before reinitializing after SPA navigation
  TRACK_DISPLAY_UPDATE_DELAY_MS: 500, // delay for track display refresh after navigation
  AUDIO_RETRY_MS: 1000, // delay before retrying audio element lookup
  PX_PER_REM: 16, // standard CSS rem-to-px ratio
  LOGO_DEFAULT_VERTICAL_PADDING_REM: 1, // default vertical padding for the header logo
  LATIN_SINGLE_LINE_HEIGHT_PX: 19, // expected single-line height for Latin characters, used as baseline for title padding
  SEEK_PAUSE_GUARD_MS: 100, // delay before re-enabling play after seek
  PLAYBACK_STEP_DURATION_SECONDS: 10, // seconds to skip forward/backward
  PROGRESS_SLIDER_GRANULARITY: 1000, // use 1000 for better granularity: 1000s = 16m40s
  VOLUME_SLIDER_GRANULARITY: 100, // percentage
  TIME_BEFORE_RESTART: 5, // seconds before restarting the track when hitting the previous track button
  TOAST_AUTO_DISMISS: 10, // seconds before auto-dismissing a toast
} as const;

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

export const PLUME_DEFAULTS = {
  durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION,
  loopMode: LOOP_MODE.NONE,
  savedVolume: 0.5,
} as const;

export interface TimeState {
  currentTime: number;
  duration: number;
  durationDisplayMethod: TimeDisplayMethodType;
}
