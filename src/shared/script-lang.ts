/**
 * Script-based language detection for BCP-47 `lang` attribute assignment.
 *
 * Used to help screen readers pronounce non-Latin artist/track titles correctly
 * when their script differs from both the host page language and Plume's active locale.
 *
 * Strategy: a two-pass scan of Unicode code points.
 *   Pass 1 — Hiragana/Katakana only. Any kana character → "ja", immediately.
 *             This ensures mixed kana+kanji text is classified as Japanese rather than Chinese.
 *   Pass 2 — All other non-Latin scripts, checked in priority order, first match wins.
 *
 * For scripts shared across multiple languages (CJK, Cyrillic, Arabic) the most-spoken
 * language for that script is used as a conservative default.
 * Returns "" for Latin/undetected text — callers should remove the `lang` attribute so the
 * element inherits its parent's declared locale instead.
 */

// Checked in pass 1: Hiragana (U+3041–U+309F) and Katakana (U+30A0–U+30FF)
const isKana = (cp: number): boolean => (cp >= 0x3041 && cp <= 0x309f) || (cp >= 0x30a0 && cp <= 0x30ff);

// Checked in pass 2, in detection-priority order. Each entry: [rangeStart, rangeEnd, BCP-47 tag].
const SCRIPT_RANGES: ReadonlyArray<readonly [number, number, string]> = [
  [0x0000, 0x007f, ""], // Basic Latin         → undetermined
  [0xac00, 0xd7ff, "ko"], // Hangul syllables    → Korean
  [0x1100, 0x11ff, "ko"], // Hangul Jamo         → Korean
  [0x0e00, 0x0e7f, "th"], // Thai                → Thai
  [0x0590, 0x05ff, "he"], // Hebrew              → Hebrew
  [0x0530, 0x058f, "hy"], // Armenian            → Armenian
  [0x10a0, 0x10ff, "ka"], // Georgian            → Georgian
  [0x0900, 0x097f, "hi"], // Devanagari          → Hindi (most-spoken)
  [0x0980, 0x09ff, "bn"], // Bengali             → Bengali
  [0x0b80, 0x0bff, "ta"], // Tamil               → Tamil
  [0x0370, 0x03ff, "el"], // Greek               → Greek
  [0x4e00, 0x9fff, "zh"], // CJK Unified         → Chinese (overridden to "ja" by pass 1 if kana present)
  [0x3400, 0x4dbf, "zh"], // CJK Extension A     → Chinese
  [0x0400, 0x04ff, "ru"], // Cyrillic            → Russian (most-spoken)
  [0x0600, 0x06ff, "ar"], // Arabic              → Arabic
] as const;

/**
 * Returns the BCP-47 tag for the dominant non-Latin script detected in `text`,
 * or `""` if only Latin/unrecognised characters are present.
 */
export const detectScriptLang = (text: string): string => {
  const scriptsFound: Record<string, number> = {};

  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    if (cp !== undefined && isKana(cp)) {
      scriptsFound["ja"] = (scriptsFound["ja"] ?? 0) + 1;
      continue; // Skip pass 2 for kana chars, so mixed Japanese text is correctly classified as "ja" rather than "zh"
    }
    for (const [lo, hi, lang] of SCRIPT_RANGES) {
      if (cp >= lo && cp <= hi) {
        scriptsFound[lang] = (scriptsFound[lang] ?? 0) + 1;
        break;
      }
    }
  }
  const maxScript = Object.entries(scriptsFound).reduce((a, b) => (a[1] > b[1] ? a : b), ["", 0]);
  return maxScript[0];
};

/**
 * Sets `el.lang` to the detected script language of `title`.
 * Removes the attribute (→ inherit from parent) when no non-Latin script is detected.
 */
export const applyTitleLang = (el: HTMLElement, title: string): void => {
  const lang = detectScriptLang(title);
  if (lang) el.lang = lang;
  else el.removeAttribute("lang");
};
