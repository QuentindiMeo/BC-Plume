import { HotkeyAction, KeyBinding } from "../domain/hotkeys";

export enum PLUME_MESSAGE_TYPE {
  HOTKEYS_UPDATED = "HOTKEYS_UPDATED",
}

interface HotkeysUpdatedMessage {
  type: PLUME_MESSAGE_TYPE.HOTKEYS_UPDATED;
  bindings: Record<HotkeyAction, KeyBinding>;
}

export type PlumeMessage = HotkeysUpdatedMessage;
