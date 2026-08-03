import { INITIAL_TIME_DISPLAY, TIME_DISPLAY_METHOD, TimeState } from "@/domain/plume";

// ? Internal helper: Format time as MM:SS
export const presentFormattedTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return INITIAL_TIME_DISPLAY;

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const presentFormattedElapsed = (state: TimeState): string => {
  return presentFormattedTime(state.currentTime);
};

export const presentFormattedDuration = (state: TimeState): string => {
  if (state.durationDisplayMethod === TIME_DISPLAY_METHOD.REMAINING) {
    const remaining = Math.floor(state.duration - state.currentTime);
    return "-" + presentFormattedTime(remaining);
  }
  return presentFormattedTime(state.duration);
};

// ? Bandcamp stores release dates in a fixed, non-localized format (e.g. "12 Apr 2019 00:00:00 GMT").
// * Formatted in UTC so the rendered day matches Bandcamp's, whatever the viewer's timezone.
export const presentReleaseDate = (rawDate: string, locale: string): string | null => {
  const trimmedDate = rawDate.trim();
  if (!/^\d/.test(trimmedDate)) return null;

  const parsedDate = new Date(trimmedDate);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return new Intl.DateTimeFormat(locale.replaceAll("_", "-"), {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsedDate);
};

export const presentProgressPercentage = (state: TimeState): number => {
  if (state.duration === 0) return 0;
  return (state.currentTime / state.duration) * 100;
};
