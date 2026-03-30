import { KeyBindingMap } from "@/domain/hotkeys";
import { LoopModeType, TimeDisplayMethodType } from "@/domain/plume";

export const BANDCAMP_TAB_PATTERN = "*://*.bandcamp.com/*";

export enum PLUME_CACHE_KEYS {
  DURATION_DISPLAY_METHOD = "plume_duration_display_method",
  VOLUME = "plume_volume",
  LOOP_MODE = "plume_loop_mode",

  HOTKEY_BINDINGS = "plume_hotkey_bindings",
  SEEK_JUMP_DURATION = "plume_seek_jump_duration",
  VOLUME_HOTKEY_STEP = "plume_volume_step",
  TRACK_RESTART_THRESHOLD = "plume_track_restart_threshold",

  LAST_SEEN_RELEASE = "plume_last_seen_release",
}

export interface LocalStorage {
  [PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD]: TimeDisplayMethodType | undefined;
  [PLUME_CACHE_KEYS.VOLUME]: number | undefined;
  [PLUME_CACHE_KEYS.LOOP_MODE]: LoopModeType | undefined;

  [PLUME_CACHE_KEYS.HOTKEY_BINDINGS]: KeyBindingMap | undefined;
  [PLUME_CACHE_KEYS.SEEK_JUMP_DURATION]: number | undefined;
  [PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP]: number | undefined;
  [PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD]: number | undefined;

  [PLUME_CACHE_KEYS.LAST_SEEN_RELEASE]: string | undefined;
}
export type PlumeCacheKey = keyof LocalStorage;
