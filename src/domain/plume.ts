export const PLUME_CONSTANTS = {
  TIME_BEFORE_RESTART: 5,
  TIME_STEP_DURATION: 10, // seconds to skip forward/backward
  PROGRESS_SLIDER_GRANULARITY: 1000, // use 1000 for better granularity: 1000s = 16m40s
  VOLUME_SLIDER_GRANULARITY: 100,
} as const;

export const PLUME_DEFAULTS = {
  savedVolume: 0.5,
} as const;

export enum TIME_DISPLAY_METHOD {
  DURATION = "duration",
  REMAINING = "remaining",
}
export type TimeDisplayMethodType = `${TIME_DISPLAY_METHOD}`;

export interface TimeState {
  currentTime: number;
  duration: number;
  durationDisplayMethod: TimeDisplayMethodType;
}
