// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));

import { HotkeyAction } from "@/domain/hotkeys";
import { buildLabel, createHotkeyRow, labelForKeyEvent } from "@/popup/components/HotkeyRow";

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

describe("createHotkeyRow — conflict dialog focus restoration", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("cancelling a conflict prompt refocuses the remap button that opened it", () => {
    const conflictingBinding = { code: "KeyB", label: "B" };
    const allBindings = () => ({ [HotkeyAction.PLAY_PAUSE]: conflictingBinding });

    const row = createHotkeyRow(
      HotkeyAction.MUTE,
      { code: "KeyA", label: "A" },
      allBindings,
      () => {},
      () => {}
    );
    document.body.appendChild(row.el); // focus restoration only observable on connected elements

    const remapBtn = row.el.querySelector<HTMLButtonElement>(".setting-row__btn")!;
    remapBtn.click(); // starts capture
    document.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyB", key: "b", bubbles: true }));

    const cancelBtn = row.el.querySelector<HTMLButtonElement>(".setting-row__conflict-btn--cancel");
    expect(cancelBtn).not.toBeNull(); // conflict prompt is showing

    cancelBtn!.click();

    expect(row.el.querySelector(".setting-row__conflict-btn--cancel")).toBeNull(); // prompt is gone
    expect(document.activeElement).toBe(remapBtn);
  });

  it("the row's role=group gets a name via aria-labelledby (M12 — buttons aren't labelable)", () => {
    const row = createHotkeyRow(
      HotkeyAction.MUTE,
      { code: "KeyA", label: "A" },
      () => ({}),
      () => {},
      () => {}
    );

    const labelledbyId = row.el.getAttribute("aria-labelledby");
    expect(labelledbyId).toBeTruthy();

    const label = row.el.querySelector(`#${labelledbyId}`);
    expect(label).not.toBeNull();
    expect(label?.textContent).toBe("LABEL__HOTKEY__MUTE");
  });
});
