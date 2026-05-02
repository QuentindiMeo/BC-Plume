// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { applyTitleLang, detectScriptLang } from "@/shared/script-lang";

describe("detectScriptLang — Latin / empty input", () => {
  it('returns "" for an empty string', () => {
    expect(detectScriptLang("")).toBe("");
  });

  it('returns "" for a purely Latin title', () => {
    expect(detectScriptLang("Bohemian Rhapsody")).toBe("");
  });

  it('returns "" for a string of only spaces and ASCII punctuation', () => {
    // spaces and punctuation are not in any script range — they do not vote
    expect(detectScriptLang("  ---  ")).toBe("");
  });

  it('returns "" for a title with accented Latin characters (Latin-1 Supplement / Extended)', () => {
    // é(U+00E9), Ü(U+00DC), ñ(U+00F1) all map to UNDETERMINED via the Latin Extended ranges
    expect(detectScriptLang("Café Über Niño")).toBe("");
  });

  it('returns "" when Latin letter count exceeds non-Latin script count', () => {
    // "Hello World (你好)": 10 Latin letters vs 2 CJK — Latin majority wins
    expect(detectScriptLang("Hello World (你好)")).toBe("");
  });
});

describe("detectScriptLang — Hiragana / Katakana (pass 1)", () => {
  it('returns "ja" for a Hiragana-only string', () => {
    expect(detectScriptLang("あいうえお")).toBe("ja");
  });

  it('returns "ja" for a Katakana-only string', () => {
    expect(detectScriptLang("アイウエオ")).toBe("ja");
  });

  it('returns "ja" for mixed Hiragana + Katakana', () => {
    expect(detectScriptLang("あアいイ")).toBe("ja");
  });

  it('returns "ja" when kana count exceeds CJK count in a mixed Japanese title', () => {
    // "まどかマギカ魔法少女": 6 kana + 4 CJK — kana majority → "ja"
    expect(detectScriptLang("まどかマギカ魔法少女")).toBe("ja");
  });
});

describe("detectScriptLang — CJK Unified Ideographs", () => {
  it('returns "zh" for a pure CJK string', () => {
    expect(detectScriptLang("月亮代表我的心")).toBe("zh");
  });

  it('returns "zh" when CJK count exceeds kana count in a mixed Japanese title', () => {
    // "月の光": 2 CJK + 1 kana — CJK majority → "zh" (known conservative default)
    expect(detectScriptLang("月の光")).toBe("zh");
  });
});

describe("detectScriptLang — other scripts (pass 2 detection)", () => {
  it('returns "ko" for Hangul', () => {
    expect(detectScriptLang("안녕하세요")).toBe("ko");
  });

  it('returns "ru" for Cyrillic-dominant title', () => {
    // "Группа Крови": 11 Cyrillic letters — space between words is not counted
    expect(detectScriptLang("Группа Крови")).toBe("ru");
  });

  it('returns "ar" for Arabic', () => {
    expect(detectScriptLang("مرحبا")).toBe("ar");
  });

  it('returns "he" for Hebrew', () => {
    expect(detectScriptLang("שלום")).toBe("he");
  });

  it('returns "el" for Greek', () => {
    expect(detectScriptLang("Καλημέρα")).toBe("el");
  });

  it('returns "th" for Thai', () => {
    expect(detectScriptLang("สวัสดี")).toBe("th");
  });

  it('returns "hi" for Devanagari', () => {
    expect(detectScriptLang("नमस्ते")).toBe("hi");
  });

  it('returns "hy" for Armenian', () => {
    expect(detectScriptLang("Բարև")).toBe("hy");
  });

  it('returns "ka" for Georgian', () => {
    expect(detectScriptLang("გამარჯობა")).toBe("ka");
  });

  it('returns "bn" for Bengali', () => {
    expect(detectScriptLang("নমস্কার")).toBe("bn");
  });

  it('returns "ta" for Tamil', () => {
    expect(detectScriptLang("வணக்கம்")).toBe("ta");
  });
});

describe("detectScriptLang — majority-wins with mixed scripts", () => {
  it("returns the non-Latin tag when non-Latin chars dominate", () => {
    // "Привет Мир": 9 Cyrillic letters — space is not counted
    expect(detectScriptLang("Привет Мир")).toBe("ru");
  });

  it('returns "" when Latin chars outnumber a minority non-Latin script', () => {
    // "Hello А": 5 Latin letters + 1 Cyrillic — Latin wins
    expect(detectScriptLang("Hello А")).toBe("");
  });
});

describe("applyTitleLang", () => {
  it("sets the lang attribute to the detected script for a non-Latin title", () => {
    const el = document.createElement("span");
    applyTitleLang(el, "あいうえお");
    expect(el.lang).toBe("ja");
  });

  it("removes the lang attribute for a Latin title so the element inherits parent lang", () => {
    const el = document.createElement("span");
    el.lang = "ja"; // previously set from a non-Latin track
    applyTitleLang(el, "Bohemian Rhapsody");
    expect(el.hasAttribute("lang")).toBe(false);
  });

  it("removes the lang attribute for an empty title", () => {
    const el = document.createElement("span");
    el.lang = "ru";
    applyTitleLang(el, "");
    expect(el.hasAttribute("lang")).toBe(false);
  });

  it("updates the lang attribute when the detected script changes between calls", () => {
    const el = document.createElement("span");
    applyTitleLang(el, "안녕하세요"); // ko
    expect(el.lang).toBe("ko");
    applyTitleLang(el, "Группа Крови"); // ru
    expect(el.lang).toBe("ru");
  });

  it("transitions from a non-Latin lang to no attribute when switching to a Latin title", () => {
    const el = document.createElement("span");
    applyTitleLang(el, "月亮代表我的心"); // zh
    expect(el.lang).toBe("zh");
    applyTitleLang(el, "Moon River");
    expect(el.hasAttribute("lang")).toBe(false);
  });
});
