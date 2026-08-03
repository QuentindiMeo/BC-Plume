import { INITIAL_TIME_DISPLAY, TIME_DISPLAY_METHOD, TimeState } from "@/domain/plume";
import { isNonIsoDateParsingSupported } from "@/shared/date-support";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(?:[T ]|$)/;

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

  // ! ISO 8601 parsing is spec-mandated, Bandcamp's RFC-2822–style format is not: only trust the engine with the latter
  // ! once it has passed the known-answer probe, so a non-conforming engine (e.g. an older Safari) hides the date
  // ! instead of rendering a wrong one.
  if (!ISO_DATE_PATTERN.test(trimmedDate) && !isNonIsoDateParsingSupported()) return null;

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
