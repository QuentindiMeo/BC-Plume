import { bindingKey } from "@/app/features/keyboard";
import type { KeyBinding } from "@/domain/hotkeys";
import { describe, expect, it } from "vitest";

const binding = (code: string, opts: Pick<KeyBinding, "ctrl" | "shift" | "alt"> = {}): KeyBinding => ({
  code,
  label: code,
  ...opts,
});

describe("bindingKey", () => {
  it("returns the bare code when no modifiers are set", () => {
    expect(bindingKey(binding("Space"))).toBe("Space");
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
    expect(bindingKey(binding("KeyA", opts))).toBe(expected);
  });

  it("treats absent modifier fields the same as false", () => {
    expect(bindingKey({ code: "KeyA", label: "A" })).toBe("KeyA");
  });

  it("two bindings with same code but different modifiers produce distinct keys", () => {
    expect(bindingKey(binding("KeyA"))).not.toBe(bindingKey(binding("KeyA", { ctrl: true })));
    expect(bindingKey(binding("KeyA", { ctrl: true }))).not.toBe(bindingKey(binding("KeyA", { shift: true })));
  });
});
