import { HotkeyAction, KeyBinding } from "../domain/hotkeys";

export enum PLUME_MESSAGE_TYPE {
  HOTKEYS_UPDATED = "HOTKEYS_UPDATED",
  SEEK_DURATION_UPDATED = "SEEK_DURATION_UPDATED",
}

interface HotkeysUpdatedMessage {
  type: PLUME_MESSAGE_TYPE.HOTKEYS_UPDATED;
  bindings: Record<HotkeyAction, KeyBinding>;
}

interface SeekDurationUpdatedMessage {
  type: PLUME_MESSAGE_TYPE.SEEK_DURATION_UPDATED;
  seekDuration: number;
}

export type PlumeMessage = HotkeysUpdatedMessage | SeekDurationUpdatedMessage;
