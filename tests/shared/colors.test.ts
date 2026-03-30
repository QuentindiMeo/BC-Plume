import {
  RGBToHSL,
  WCAG_CONTRAST_NORMAL,
  adjustColorContrast,
  isGrayscale,
  measureContrastRatioWCAG,
} from "@/shared/colors";
import { describe, expect, it } from "vitest";

describe("measureContrastRatioWCAG", () => {
  it("returns ~18.7:1 for white against near-black background", () => {
    expect(measureContrastRatioWCAG([255, 255, 255])).toBeCloseTo(18.7, 0);
  });

  it("returns ~1:1 for black against near-black background", () => {
    expect(measureContrastRatioWCAG([0, 0, 0])).toBeLessThanOrEqual(1.2);
  });

  it("returns a ratio greater than 1 for pure red", () => {
    expect(measureContrastRatioWCAG([255, 0, 0])).toBeGreaterThan(1);
  });
});

describe("RGBToHSL", () => {
  it("converts pure red [255,0,0] to hue≈0, saturation=100, lightness=50", () => {
    const [h, s, l] = RGBToHSL(255, 0, 0);
    expect(h).toBeCloseTo(0, 0);
    expect(s).toBeCloseTo(100, 0);
    expect(l).toBeCloseTo(50, 0);
  });

  it("converts white [255,255,255] to saturation=0, lightness=100", () => {
    const [, s, l] = RGBToHSL(255, 255, 255);
    expect(s).toBeCloseTo(0, 0);
    expect(l).toBeCloseTo(100, 0);
  });

  it("converts black [0,0,0] to saturation=0, lightness=0", () => {
    const [, s, l] = RGBToHSL(0, 0, 0);
    expect(s).toBeCloseTo(0, 0);
    expect(l).toBeCloseTo(0, 0);
  });

  it("converts green-dominant [0,255,128] via case g: to hue≈150, saturation=100, lightness≈50", () => {
    const [h, s, l] = RGBToHSL(0, 255, 128);
    expect(h).toBeCloseTo(150, 0);
    expect(s).toBeCloseTo(100, 0);
    expect(l).toBeCloseTo(50, 0);
  });

  it("uses d/(2-max-min) saturation formula when lightness>50% [255,200,200]", () => {
    const [h, s, l] = RGBToHSL(255, 200, 200);
    expect(l).toBeGreaterThan(50);
    expect(s).toBeCloseTo(100, 0);
    expect(h).toBeCloseTo(0, 0);
  });

  it("wraps hue by +6 when red is dominant and g<b [255,0,200]", () => {
    const [h, s, l] = RGBToHSL(255, 0, 200);
    expect(h).toBeCloseTo(313, 0);
    expect(s).toBeCloseTo(100, 0);
    expect(l).toBeCloseTo(50, 0);
  });
});

describe("isGrayscale", () => {
  it("returns true for black [0,0,0]", () => {
    expect(isGrayscale([0, 0, 0])).toBe(true);
  });

  it("returns true for white [255,255,255]", () => {
    expect(isGrayscale([255, 255, 255])).toBe(true);
  });

  it("returns true for mid gray [128,128,128]", () => {
    expect(isGrayscale([128, 128, 128])).toBe(true);
  });

  it("returns false for pure red [255,0,0]", () => {
    expect(isGrayscale([255, 0, 0])).toBe(false);
  });

  it("returns false for blue-ish [0,128,255]", () => {
    expect(isGrayscale([0, 128, 255])).toBe(false);
  });
});

describe("adjustColorContrast", () => {
  it("lifts a very dark color to meet WCAG_CONTRAST_NORMAL (4.5)", () => {
    const result = adjustColorContrast([10, 10, 10], WCAG_CONTRAST_NORMAL);

    const match = result.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/);
    expect(match).not.toBeNull();

    const [r, g, b] = [Number(match![1]), Number(match![2]), Number(match![3])];
    const contrast = measureContrastRatioWCAG([r, g, b]);
    expect(contrast).toBeGreaterThanOrEqual(WCAG_CONTRAST_NORMAL);
  });

  it("returns a valid rgb(...) string", () => {
    const result = adjustColorContrast([50, 50, 200], WCAG_CONTRAST_NORMAL);
    expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  });
});
