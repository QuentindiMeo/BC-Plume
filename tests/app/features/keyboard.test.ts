import { bindingKey } from "@/app/features/keyboard";
import type { KeyBinding } from "@/domain/hotkeys";
import { describe, expect, it } from "vitest";

const binding = (
  code: string,
  opts: Pick<KeyBinding, "ctrl" | "shift" | "alt"> & { label?: string } = {}
): KeyBinding => ({
  code,
  label: opts.label ?? code,
  ...(opts.ctrl && { ctrl: true }),
  ...(opts.shift && { shift: true }),
  ...(opts.alt && { alt: true }),
});

describe("bindingKey", () => {
  it("returns the bare code when no modifiers are set and key is non-letter", () => {
    expect(bindingKey(binding("Space"))).toBe("Space");
  });

  it("returns 'key:<char>' for plain single-letter bindings (layout-independent)", () => {
    expect(bindingKey({ code: "KeyM", label: "M" })).toBe("key:m");
    expect(bindingKey({ code: "KeyA", label: "A" })).toBe("key:a");
    expect(bindingKey({ code: "Semicolon", label: "M" })).toBe("key:m");
  });

  it("letter matching is case-insensitive", () => {
    expect(bindingKey({ code: "KeyM", label: "m" })).toBe("key:m");
    expect(bindingKey({ code: "KeyM", label: "M" })).toBe("key:m");
  });

  it.each([
    [{ ctrl: true as const }, "ctrl:KeyA"],
    [{ shift: true as const }, "shift:KeyA"],
    [{ alt: true as const }, "alt:KeyA"],
    [{ ctrl: true, shift: true } as const, "ctrl:shift:KeyA"],
    [{ ctrl: true, alt: true } as const, "ctrl:alt:KeyA"],
    [{ shift: true, alt: true } as const, "shift:alt:KeyA"],
    [{ ctrl: true, shift: true, alt: true } as const, "ctrl:shift:alt:KeyA"],
  ])("modifiers %o → %s", (opts: Pick<KeyBinding, "ctrl" | "shift" | "alt">, expected: string) => {
    expect(bindingKey(binding("KeyA", { ...opts, label: "A" }))).toBe(expected);
  });

  it("letter binding with any modifier falls back to code-based lookup", () => {
    expect(bindingKey({ code: "KeyM", label: "M", ctrl: true })).toBe("ctrl:KeyM");
    expect(bindingKey({ code: "KeyM", label: "M", shift: true })).toBe("shift:KeyM");
    expect(bindingKey({ code: "KeyM", label: "M", alt: true })).toBe("alt:KeyM");
  });

  it("treats absent modifier fields the same as false for letter bindings", () => {
    expect(bindingKey({ code: "KeyA", label: "A" })).toBe("key:a");
  });

  it("two bindings with same code but different modifiers produce distinct keys", () => {
    expect(bindingKey(binding("Space"))).not.toBe(bindingKey(binding("Space", { ctrl: true })));
    expect(bindingKey(binding("Space", { ctrl: true }))).not.toBe(bindingKey(binding("Space", { shift: true })));
  });

  it("non-letter single-char keys (digits, symbols) use code-based lookup", () => {
    expect(bindingKey({ code: "Digit1", label: "1" })).toBe("Digit1");
    expect(bindingKey({ code: "BracketLeft", label: "[" })).toBe("BracketLeft");
  });
});
