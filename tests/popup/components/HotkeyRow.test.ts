import { describe, expect, it } from "vitest";

import { buildLabel, labelForKeyEvent } from "@/popup/components/HotkeyRow";

const key = (code: string, key: string) => ({ code, key });

describe("labelForKeyEvent", () => {
  it.each([
    ["ArrowUp", "ArrowUp", "↑"],
    ["ArrowDown", "ArrowDown", "↓"],
    ["ArrowLeft", "ArrowLeft", "←"],
    ["ArrowRight", "ArrowRight", "→"],
  ])("%s → %s", (code: string, k: string, expected: string) => {
    expect(labelForKeyEvent(key(code, k))).toBe(expected);
  });

  it("returns uppercase letter for single-char key", () => {
    expect(labelForKeyEvent(key("KeyA", "a"))).toBe("A");
  });

  it("returns Space for space key", () => {
    expect(labelForKeyEvent(key("Space", " "))).toBe("Space");
  });

  it("strips Key prefix", () => {
    expect(labelForKeyEvent(key("KeyF", "f"))).toBe("F");
  });

  it("strips Digit prefix", () => {
    expect(labelForKeyEvent(key("Digit3", "3"))).toBe("3");
  });

  it("formats Numpad non-digit keys via prefix (single-char key takes priority)", () => {
    // Single-char e.key wins: Numpad0 has e.key="0" → "0"
    expect(labelForKeyEvent(key("Numpad0", "0"))).toBe("0");
    // Multi-char e.key falls through to prefix: NumpadEnter has e.key="Enter" → "Num Enter"
    expect(labelForKeyEvent(key("NumpadEnter", "Enter"))).toBe("Num Enter");
  });

  it("falls back to code for unrecognised keys", () => {
    expect(labelForKeyEvent(key("PageUp", "PageUp"))).toBe("PageUp");
  });
});

describe("buildLabel", () => {
  it("returns the key label alone when no modifiers are active", () => {
    expect(buildLabel(false, false, false, "A")).toBe("A");
  });

  it.each([
    [true, false, false, "A", "Ctrl+A"],
    [false, true, false, "A", "Shift+A"],
    [false, false, true, "A", "Alt+A"],
    [true, true, false, "A", "Ctrl+Shift+A"],
    [true, false, true, "A", "Ctrl+Alt+A"],
    [false, true, true, "A", "Shift+Alt+A"],
    [true, true, true, "A", "Ctrl+Shift+Alt+A"],
  ])(
    "ctrl=%s shift=%s alt=%s key=%s → %s",
    (ctrl: boolean, shift: boolean, alt: boolean, k: string, expected: string) => {
      expect(buildLabel(ctrl, shift, alt, k)).toBe(expected);
    }
  );

  it("works with arrow symbols as the key label", () => {
    expect(buildLabel(true, false, false, "↑")).toBe("Ctrl+↑");
  });

  it("works with multi-char key labels", () => {
    expect(buildLabel(false, true, false, "Space")).toBe("Shift+Space");
  });
});
