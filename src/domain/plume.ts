export const PLUME_CONSTANTS = {
  TIME_BEFORE_RESTART: 5,
  TIME_STEP_DURATION: 10, // seconds to skip forward/backward
  PROGRESS_SLIDER_GRANULARITY: 1000, // use 1000 for better granularity: 1000s = 16m40s
  VOLUME_SLIDER_GRANULARITY: 100,
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
