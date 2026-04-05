import { getBcPlayerInstance } from "@/app/stores/adapters";
import {
  adjustColorContrast,
  FALLBACK_GRAY_RGB_STR,
  isGrayscale,
  measureContrastRatioWCAG,
  RGBToHSL,
  WCAG_CONTRAST_NORMAL,
} from "@/shared/colors";
import { getString } from "@/shared/i18n";

const getArtistNameElement = (): HTMLSpanElement => {
  const bcPlayer = getBcPlayerInstance();
  const infoSection = bcPlayer.getInfoSection();
  const infoSectionLinks = infoSection?.querySelectorAll("span") ?? [];
  const artistElementIdx = infoSectionLinks.length - 1; // 0 on album pages, 1 on track pages
  return infoSectionLinks[artistElementIdx].querySelector("a")! as HTMLSpanElement;
};

const getTrackTitleElement = (): HTMLElement | null => {
  const bcPlayer = getBcPlayerInstance();
  return bcPlayer.getTrackTitleElement();
};

// Determine appropriate accent color based on WCAG contrast with Bandcamp theme colors
export const getAppropriateAccentColor = (): string => {
  const trackTitleEl = getTrackTitleElement();
  const artistEl = getArtistNameElement();
  if (!trackTitleEl || !artistEl) return FALLBACK_GRAY_RGB_STR;

  const trackColor = getComputedStyle(trackTitleEl).color;
  const artistColor = getComputedStyle(artistEl).color;
  const trackColorMatch = trackColor.match(/\d+/g);
  const artistColorMatch = artistColor.match(/\d+/g);

  // Fallback to gray if color regex matching fails
  if (!trackColorMatch || !artistColorMatch) {
    return FALLBACK_GRAY_RGB_STR;
  }

  const trackColorRGB = trackColorMatch.map(Number) as [number, number, number];
  const artistColorRGB = artistColorMatch.map(Number) as [number, number, number];
  const trackColorContrast = measureContrastRatioWCAG(trackColorRGB);
  const artistColorContrast = measureContrastRatioWCAG(artistColorRGB);
  if (trackColorContrast > WCAG_CONTRAST_NORMAL && artistColorContrast > WCAG_CONTRAST_NORMAL) {
    const trackColorSaturation = RGBToHSL(...trackColorRGB)[1];
    const artistColorSaturation = RGBToHSL(...artistColorRGB)[1];
    return trackColorSaturation > artistColorSaturation ? trackColor : artistColor;
  } else if (trackColorContrast > WCAG_CONTRAST_NORMAL || artistColorContrast > WCAG_CONTRAST_NORMAL) {
    return trackColorContrast > WCAG_CONTRAST_NORMAL ? trackColor : artistColor;
  } else {
    const preferredColor = trackColorContrast > artistColorContrast ? trackColor : artistColor;
    const preferredColorMatch = preferredColor.match(/\d+/g);
    if (!preferredColorMatch) {
      return FALLBACK_GRAY_RGB_STR;
    }
    const preferredColorRgb = preferredColorMatch.map(Number) as [number, number, number];
    if (isGrayscale(preferredColorRgb)) return FALLBACK_GRAY_RGB_STR;
    return adjustColorContrast(preferredColorRgb, WCAG_CONTRAST_NORMAL);
  }
};

export const getCurrentTrackTitle = (isAlbumPage: boolean): string => {
  const bcPlayer = getBcPlayerInstance();
  return bcPlayer.getTrackTitle(isAlbumPage ? "album" : "track") ?? getString("LABEL__TRACK_UNKNOWN");
};
