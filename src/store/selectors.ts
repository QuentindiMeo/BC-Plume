import { TIME_DISPLAY_METHOD } from "../types";
import type { AppState } from "./store";

// Function to format time as MM:SS
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const selectors = {
  getFormattedElapsed: (state: AppState): string => {
    return formatTime(state.currentTime);
  },

  getFormattedDuration: (state: AppState): string => {
    if (state.durationDisplayMethod === TIME_DISPLAY_METHOD.REMAINING) {
      const remaining = state.duration - state.currentTime;
      return "-" + formatTime(remaining);
    }
    return formatTime(state.duration);
  },

  getProgressPercentage: (state: AppState): number => {
    if (state.duration === 0) return 0;
    return (state.currentTime / state.duration) * 100;
  },
};
