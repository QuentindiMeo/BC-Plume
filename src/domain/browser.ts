import { LoopModeType, TimeDisplayMethodType } from "./plume";

export enum PLUME_CACHE_KEYS {
  DURATION_DISPLAY_METHOD = "plume_duration_display_method",
  VOLUME = "plume_volume",
  LOOP_MODE = "plume_loop_mode",
}

export interface LocalStorage {
  [PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD]: TimeDisplayMethodType | undefined;
  [PLUME_CACHE_KEYS.VOLUME]: number | undefined;
  [PLUME_CACHE_KEYS.LOOP_MODE]: LoopModeType | undefined;
}
export type PlumeCacheKey = keyof LocalStorage;
