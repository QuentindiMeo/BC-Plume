import { TIME_DISPLAY_METHOD } from "../domain/bandcamp";
import type { AppState } from "../infra/AppStoreImpl";

// Internal helper: Format time as MM:SS
const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const presentFormattedElapsed = (state: AppState): string => {
  return formatTime(state.currentTime);
};

export const presentFormattedDuration = (state: AppState): string => {
  if (state.durationDisplayMethod === TIME_DISPLAY_METHOD.REMAINING) {
    const remaining = state.duration - state.currentTime;
    return "-" + formatTime(remaining);
  }
  return formatTime(state.duration);
};

export const presentProgressPercentage = (state: AppState): number => {
  if (state.duration === 0) return 0;
  return (state.currentTime / state.duration) * 100;
};
