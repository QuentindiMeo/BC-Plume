export enum HotkeyAction {
  PLAY_PAUSE = "PLAY_PAUSE",
  TIME_BACKWARD = "TIME_BACKWARD",
  TIME_FORWARD = "TIME_FORWARD",
  VOLUME_UP = "VOLUME_UP",
  VOLUME_DOWN = "VOLUME_DOWN",
  TRACK_BACKWARD = "TRACK_BACKWARD",
  TRACK_FORWARD = "TRACK_FORWARD",
  FULLSCREEN = "FULLSCREEN",
  MUTE = "MUTE",
  LOOP_CYCLE = "LOOP_CYCLE",
}

export type HotkeyCode = string;

export interface KeyBinding {
  code: HotkeyCode;
  label: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export type KeyBindingMap = Partial<Record<HotkeyAction, KeyBinding>>;

export const DEFAULT_HOTKEYS: Record<HotkeyAction, KeyBinding> = {
  [HotkeyAction.PLAY_PAUSE]: { code: "Space", label: "Space" },
  [HotkeyAction.TIME_BACKWARD]: { code: "ArrowLeft", label: "←" },
  [HotkeyAction.TIME_FORWARD]: { code: "ArrowRight", label: "→" },
  [HotkeyAction.VOLUME_UP]: { code: "ArrowUp", label: "↑" },
  [HotkeyAction.VOLUME_DOWN]: { code: "ArrowDown", label: "↓" },
  [HotkeyAction.TRACK_BACKWARD]: { code: "PageUp", label: "Page Up" },
  [HotkeyAction.TRACK_FORWARD]: { code: "PageDown", label: "Page Down" },
  [HotkeyAction.FULLSCREEN]: { code: "KeyF", label: "F" },
  [HotkeyAction.MUTE]: { code: "KeyM", label: "M" },
  [HotkeyAction.LOOP_CYCLE]: { code: "KeyL", label: "L" },
};
