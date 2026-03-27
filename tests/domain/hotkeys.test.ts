import { DEFAULT_HOTKEYS, HotkeyAction } from "@/src/domain/hotkeys";
import { describe, expect, it } from "vitest";

describe("HotkeyAction", () => {
  it("defines all expected action values", () => {
    const expected = [
      "PLAY_PAUSE",
      "TIME_BACKWARD",
      "TIME_FORWARD",
      "VOLUME_UP",
      "VOLUME_DOWN",
      "TRACK_BACKWARD",
      "TRACK_FORWARD",
      "FULLSCREEN",
      "MUTE",
      "LOOP_CYCLE",
    ];
    expect(Object.values(HotkeyAction)).toEqual(expected);
  });
});

describe("DEFAULT_HOTKEYS", () => {
  const actions = Object.values(HotkeyAction);

  it("has an entry for every HotkeyAction", () => {
    for (const action of actions) {
      expect(DEFAULT_HOTKEYS).toHaveProperty(action);
    }
  });

  it("has no extra keys beyond the defined HotkeyAction values", () => {
    expect(Object.keys(DEFAULT_HOTKEYS)).toHaveLength(actions.length);
  });

  it("has a non-empty code and non-empty label for every binding", () => {
    for (const action of actions) {
      const binding = DEFAULT_HOTKEYS[action];
      expect(binding.code, `${action}.code should be non-empty`).toBeTruthy();
      expect(binding.label, `${action}.label should be non-empty`).toBeTruthy();
    }
  });

  it("maps PLAY_PAUSE to Space", () => {
    expect(DEFAULT_HOTKEYS[HotkeyAction.PLAY_PAUSE]).toEqual({ code: "Space", label: "Space" });
  });

  it("maps TIME_BACKWARD to ArrowLeft", () => {
    expect(DEFAULT_HOTKEYS[HotkeyAction.TIME_BACKWARD]).toEqual({ code: "ArrowLeft", label: "←" });
  });

  it("maps TIME_FORWARD to ArrowRight", () => {
    expect(DEFAULT_HOTKEYS[HotkeyAction.TIME_FORWARD]).toEqual({ code: "ArrowRight", label: "→" });
  });

  it("maps VOLUME_UP to ArrowUp", () => {
    expect(DEFAULT_HOTKEYS[HotkeyAction.VOLUME_UP]).toEqual({ code: "ArrowUp", label: "↑" });
  });

  it("maps VOLUME_DOWN to ArrowDown", () => {
    expect(DEFAULT_HOTKEYS[HotkeyAction.VOLUME_DOWN]).toEqual({ code: "ArrowDown", label: "↓" });
  });

  it("has unique codes across all actions (no two actions share the same code)", () => {
    const codes = actions.map((action) => DEFAULT_HOTKEYS[action].code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });
});
