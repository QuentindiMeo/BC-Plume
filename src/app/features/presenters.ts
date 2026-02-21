import { TIME_DISPLAY_METHOD } from "../../domain/bandcamp";
import { AppCore } from "../../infra/AppCore";

// Internal helper: Format time as MM:SS
export const presentFormattedTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const presentFormattedElapsed = (state: AppCore): string => {
  return presentFormattedTime(state.currentTime);
};

export const presentFormattedDuration = (state: AppCore): string => {
  if (state.durationDisplayMethod === TIME_DISPLAY_METHOD.REMAINING) {
    const remaining = Math.floor(state.duration - state.currentTime);
    return "-" + presentFormattedTime(remaining);
  }
  return presentFormattedTime(state.duration);
};

export const presentProgressPercentage = (state: AppCore): number => {
  if (state.duration === 0) return 0;
  return (state.currentTime / state.duration) * 100;
};
