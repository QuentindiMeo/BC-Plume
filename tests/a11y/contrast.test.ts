import { describe, expect, it } from "vitest";

import { measureContrastRatioWCAG, WCAG_CONTRAST_LARGE, WCAG_CONTRAST_NORMAL } from "@/shared/colors";

type RGB = [number, number, number];

const hexToRgb = (hex: string): RGB => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// Porter-Duff "over": composites a translucent foreground onto an opaque background.
const compositeOver = (fg: RGB, alpha: number, bg: RGB): RGB =>
  fg.map((c, i) => c * alpha + bg[i] * (1 - alpha)) as RGB;

describe("H3 — contrast fixes clear their WCAG threshold", () => {
  // .plume-tracklist-item__number / __duration sit inside the tracklist dropdown, so the real
  // backdrop behind them is three translucent layers deep: the host page's own color, then
  // #plume-root's bg-black/60, then the dropdown's own bg-glass-bg. This model reproduces the
  // audit's documented ratios exactly at the old 0.45 alpha (2.99 / 4.18 / 4.41), confirming it.
  const ROOT_OVERLAY_ALPHA = 0.6; // #plume-root bg-black/60
  const GLASS_BG_ALPHA = 0.2; // --color-glass-bg: rgba(0, 0, 0, 0.2)
  const TEXT_MUTED_ALPHA = 0.72; // --color-text-muted, was 0.45

  const HOST_BACKDROPS: [string, RGB][] = [
    ["a white host page", [255, 255, 255]],
    ["a mid-gray host page", [128, 128, 128]],
    ["a black host page", [0, 0, 0]],
  ];

  it.each(HOST_BACKDROPS)("tracklist number/duration text clears 4.5:1 on %s", (_label: string, hostBg: RGB) => {
    const afterRoot = compositeOver([0, 0, 0], ROOT_OVERLAY_ALPHA, hostBg);
    const afterGlass = compositeOver([0, 0, 0], GLASS_BG_ALPHA, afterRoot);
    const renderedText = compositeOver([255, 255, 255], TEXT_MUTED_ALPHA, afterGlass);

    expect(measureContrastRatioWCAG(renderedText, afterGlass)).toBeGreaterThanOrEqual(WCAG_CONTRAST_NORMAL);
  });

  it("popup error text clears 4.5:1 on --color-popup-bg", () => {
    const errorText = hexToRgb("#ef6a5c"); // src/popup/popup.scss .general-row__error
    const popupBg = hexToRgb("#1a1a1a"); // --color-popup-bg

    expect(measureContrastRatioWCAG(errorText, popupBg)).toBeGreaterThanOrEqual(WCAG_CONTRAST_NORMAL);
  });

  it.each([
    ["--color-popup-bg", "#1a1a1a"],
    ["--color-popup-surface", "#242424"],
  ])("popup control border clears 3:1 on %s", (_token: string, bgHex: string) => {
    const border = hexToRgb("#707070"); // --color-popup-border, was #3a3a3a

    expect(measureContrastRatioWCAG(border, hexToRgb(bgHex))).toBeGreaterThanOrEqual(WCAG_CONTRAST_LARGE);
  });
});
