// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeAppCore } from "../../fakes/FakeAppCore";

let fakeAppCore = new FakeAppCore();
vi.mock("@/app/stores/AppCoreImpl", () => ({ getAppCoreInstance: () => fakeAppCore }));
vi.mock("@/app/stores/adapters", () => ({
  getMessageReceiverInstance: () => ({ onMessage: () => () => {} }),
  getMusicPlayerInstance: () => ({}),
}));
vi.mock("@/app/use-cases/seek-to-progress", () => ({ seekToProgress: vi.fn() }));
vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/shared/logger", () => ({ CPL: {}, logger: vi.fn() }));
vi.mock("@/infra/elements/plume", () => ({
  PLUME_ELEM_SELECTORS: { tracklistDropdown: "div#plume-tracklist-dropdown" },
}));

import { bindingKey, setupHotkeys } from "@/app/features/keyboard";
import { seekToProgress } from "@/app/use-cases/seek-to-progress";
import { type KeyBinding, DEFAULT_HOTKEYS } from "@/domain/hotkeys";
import { PLUME_DEFAULTS, type FeatureFlags } from "@/domain/plume";

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

describe("setupHotkeys — arrow keys inside tracklist", () => {
  const noopHandlers = {
    handlePlayPause: vi.fn(),
    handleTimeBackward: vi.fn(),
    handleTimeForward: vi.fn(),
    handleTrackBackward: vi.fn(),
    handleTrackForward: vi.fn(),
    handleMuteToggle: vi.fn(),
    toggleFullscreenMode: vi.fn(),
    handleLoopCycle: vi.fn(),
  };

  let cleanup: () => void;
  let dropdown: HTMLDivElement;
  let item: HTMLDivElement;

  beforeEach(() => {
    fakeAppCore = new FakeAppCore();
    dropdown = document.createElement("div");
    dropdown.id = "plume-tracklist-dropdown";
    item = document.createElement("div");
    dropdown.appendChild(item);
    document.body.appendChild(dropdown);
    cleanup = setupHotkeys(noopHandlers, DEFAULT_HOTKEYS);
  });

  afterEach(() => {
    cleanup();
    document.body.removeChild(dropdown);
    vi.clearAllMocks();
  });

  const fireKey = (target: EventTarget, code: string): KeyboardEvent => {
    const event = new KeyboardEvent("keydown", { code, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event;
  };

  it("suppresses up/down/Space/Enter keys when focus is inside the tracklist dropdown", () => {
    const event1 = fireKey(item, "ArrowUp");
    expect(event1.defaultPrevented).toBe(false);
    const event2 = fireKey(item, "ArrowDown");
    expect(event2.defaultPrevented).toBe(false);
    const event3 = fireKey(item, "Space");
    expect(event3.defaultPrevented).toBe(false);
    const event4 = fireKey(item, "Enter");
    expect(event4.defaultPrevented).toBe(false);
  });

  it("does NOT suppress up/down/Space hotkeys when focus is outside the tracklist", () => {
    const outside = document.createElement("div");
    document.body.appendChild(outside);
    const event1 = fireKey(outside, "ArrowUp");
    expect(event1.defaultPrevented).toBe(true);
    const event2 = fireKey(outside, "ArrowDown");
    expect(event2.defaultPrevented).toBe(true);
    const event3 = fireKey(outside, "Space");
    expect(event3.defaultPrevented).toBe(true);
    document.body.removeChild(outside);
  });

  it("does NOT suppress non-arrow hotkeys when focus is inside the tracklist", () => {
    const { code, label: key } = DEFAULT_HOTKEYS.MUTE;
    const event = new KeyboardEvent("keydown", { code, key, bubbles: true, cancelable: true });
    item.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(noopHandlers.handleMuteToggle).toHaveBeenCalled();
  });
});

describe("setupHotkeys — feature flag guards", () => {
  const noopHandlers = {
    handlePlayPause: vi.fn(),
    handleTimeBackward: vi.fn(),
    handleTimeForward: vi.fn(),
    handleTrackBackward: vi.fn(),
    handleTrackForward: vi.fn(),
    handleMuteToggle: vi.fn(),
    toggleFullscreenMode: vi.fn(),
    handleLoopCycle: vi.fn(),
  };

  let cleanup: () => void;

  const setupWithFlags = (overrides: Partial<FeatureFlags>) => {
    const flags = { ...PLUME_DEFAULTS.featureFlags, ...overrides };
    fakeAppCore = new FakeAppCore({ featureFlags: flags });
    cleanup = setupHotkeys(noopHandlers, DEFAULT_HOTKEYS);
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("blocks quick-seek digit keys when quickSeek flag is off", () => {
    setupWithFlags({ quickSeek: false });
    const event = new KeyboardEvent("keydown", { code: "Digit5", key: "5", bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(vi.mocked(seekToProgress)).not.toHaveBeenCalled();
  });

  it("allows quick-seek digit keys when quickSeek flag is on", () => {
    setupWithFlags({ quickSeek: true });
    const event = new KeyboardEvent("keydown", { code: "Digit5", key: "5", bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(vi.mocked(seekToProgress)).toHaveBeenCalled();
  });

  it("blocks fullscreen hotkey when fullscreen flag is off", () => {
    setupWithFlags({ fullscreen: false });
    const { code, label: key } = DEFAULT_HOTKEYS.FULLSCREEN;
    const event = new KeyboardEvent("keydown", { code, key, bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(noopHandlers.toggleFullscreenMode).not.toHaveBeenCalled();
  });

  it("blocks loop cycle hotkey when loopModes flag is off", () => {
    setupWithFlags({ loopModes: false });
    const { code, label: key } = DEFAULT_HOTKEYS.LOOP_CYCLE;
    const event = new KeyboardEvent("keydown", { code, key, bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(noopHandlers.handleLoopCycle).not.toHaveBeenCalled();
  });

  it("allows loop cycle hotkey when loopModes flag is on", () => {
    setupWithFlags({ loopModes: true });
    const { code, label: key } = DEFAULT_HOTKEYS.LOOP_CYCLE;
    const event = new KeyboardEvent("keydown", { code, key, bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(noopHandlers.handleLoopCycle).toHaveBeenCalled();
  });
});
