export const WCAG_CONTRAST_NORMAL = 4.5; // Normal text AA standard
export const WCAG_CONTRAST_LARGE = 3; // Large text / UI component AA standard
export const FALLBACK_GRAY_RGB_STR = "rgb(127, 127, 127)";
const CONTRAST_ADJUSTMENT_STEP = 0.05;

const getLuminance = (rgb: [number, number, number]): number => {
  const [r, g, b] = rgb.map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Assumed dark background for WCAG contrast calculations (Bandcamp's page background).
const ASSUMED_BG_RGB: [number, number, number] = [18, 18, 18];

export const measureContrastRatioWCAG = (rgb: [number, number, number]): number => {
  const bgRgb = ASSUMED_BG_RGB;

  const L1 = getLuminance(rgb);
  const L2 = getLuminance(bgRgb);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
};

export const RGBToHSL = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let [h, s, l] = [0, 0, (max + min) / 2];

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
};

export const isGrayscale = (rgb: [number, number, number]): boolean => RGBToHSL(...rgb)[1] === 0;

export const adjustColorContrast = (rgb: [number, number, number], minContrast: number): string => {
  let current = [...rgb] as [number, number, number];
  let factor = 0;
  while (measureContrastRatioWCAG(current) < minContrast && factor < 1) {
    factor += CONTRAST_ADJUSTMENT_STEP;
    current = current.map((c) => Math.round(c + (255 - c) * factor)) as [number, number, number];
  }

  return `rgb(${current.map((c) => Math.round(c)).join(", ")})`;
};
