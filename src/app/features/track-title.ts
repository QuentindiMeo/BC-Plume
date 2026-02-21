import { BC_ELEM_IDENTIFIERS } from "../../domain/bandcamp";
import {
  adjustColorContrast,
  FALLBACK_GRAY_RGB_STR,
  isGrayscale,
  measureContrastRatioWCAG,
  RGBToHSL,
  WCAG_CONTRAST_NORMAL,
} from "../../shared/colors";
import { getString } from "./i18n";

const getArtistNameElement = (): HTMLSpanElement => {
  const infoSection = document.querySelector(BC_ELEM_IDENTIFIERS.infoSection) as HTMLDivElement;
  const infoSectionLinks = infoSection.querySelectorAll("span");
  const artistElementIdx = infoSectionLinks.length - 1; // idx should be 0 if album page, 1 if track page
  return infoSectionLinks[artistElementIdx].querySelector("a")! as HTMLSpanElement;
};

const getTrackTitleElement = (): HTMLSpanElement => {
  return document.querySelector(BC_ELEM_IDENTIFIERS.songPageCurrentTrackTitle) as HTMLSpanElement;
};

// Determine appropriate pretext color based on WCAG contrast with Bandcamp theme colors
export const getAppropriatePretextColor = (): string => {
  const trackColor = getComputedStyle(getTrackTitleElement()).color;
  const artistColor = getComputedStyle(getArtistNameElement()).color;
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
  const titleElement = isAlbumPage
    ? (document.querySelector(BC_ELEM_IDENTIFIERS.albumPageCurrentTrackTitle) as HTMLSpanElement)
    : (document.querySelector(BC_ELEM_IDENTIFIERS.songPageCurrentTrackTitle) as HTMLSpanElement);
  if (!titleElement?.textContent) return getString("LABEL__TRACK_UNKNOWN");

  return titleElement.textContent.trim();
};
