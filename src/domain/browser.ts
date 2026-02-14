import { TimeDisplayMethodType } from "./bandcamp";
import { PLUME_CACHE_KEYS } from "./plume";

export interface LocalStorage {
  [PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD]: TimeDisplayMethodType | undefined;
  [PLUME_CACHE_KEYS.VOLUME]: number | undefined;
}
