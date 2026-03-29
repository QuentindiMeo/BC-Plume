import { labelForKeyEvent } from "@/popup/components/HotkeyRow";
import { describe, it, expect } from "vitest";

const key = (code: string, key: string) => ({ code, key });

describe("labelForKeyEvent", () => {
  it.each([
    ["ArrowUp",    "ArrowUp",    "↑"],
    ["ArrowDown",  "ArrowDown",  "↓"],
    ["ArrowLeft",  "ArrowLeft",  "←"],
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
