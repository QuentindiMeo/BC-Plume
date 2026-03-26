import { HotkeyAction, KeyBinding } from "../domain/hotkeys";

export enum PLUME_MESSAGE_TYPE {
  HOTKEYS_UPDATED = "HOTKEYS_UPDATED",
  SEEK_JUMP_DURATION_UPDATED = "SEEK_JUMP_DURATION_UPDATED",
  VOLUME_HOTKEY_STEP_UPDATED = "VOLUME_HOTKEY_STEP_UPDATED",
  TRACK_RESTART_THRESHOLD_UPDATED = "TRACK_RESTART_THRESHOLD_UPDATED",
}

interface HotkeysUpdatedMessage {
  type: PLUME_MESSAGE_TYPE.HOTKEYS_UPDATED;
  bindings: Record<HotkeyAction, KeyBinding>;
}

interface SeekJumpDurationUpdatedMessage {
  type: PLUME_MESSAGE_TYPE.SEEK_JUMP_DURATION_UPDATED;
  seekJumpDuration: number;
}

interface VolumeHotkeyStepUpdatedMessage {
  type: PLUME_MESSAGE_TYPE.VOLUME_HOTKEY_STEP_UPDATED;
  volumeHotkeyStep: number;
}

interface TrackRestartThresholdUpdatedMessage {
  type: PLUME_MESSAGE_TYPE.TRACK_RESTART_THRESHOLD_UPDATED;
  trackRestartThreshold: number;
}

export type PlumeMessage =
  | HotkeysUpdatedMessage
  | SeekJumpDurationUpdatedMessage
  | VolumeHotkeyStepUpdatedMessage
  | TrackRestartThresholdUpdatedMessage;
