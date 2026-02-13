const getLuminance = (rgb: [number, number, number]): number => {
  const [r, g, b] = rgb.map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const measureContrastRatioWCAG = (rgb: [number, number, number]): number => {
  const bgRgb: [number, number, number] = [18, 18, 18];

  const L1 = getLuminance(rgb);
  const L2 = getLuminance(bgRgb);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
};
