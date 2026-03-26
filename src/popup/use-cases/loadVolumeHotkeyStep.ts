import { PLUME_CACHE_KEYS } from "../../domain/browser";
import { assertBoundedInteger, VOLUME_HOTKEY_STEP_MAX, VOLUME_HOTKEY_STEP_MIN, WholeNumber } from "../../domain/plume";
import { inferBrowserApi } from "../../shared/browser";

export const loadVolumeHotkeyStep = async (): Promise<WholeNumber | undefined> => {
  const browserApi = inferBrowserApi();

  const cache = await browserApi.storage.local.get([PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP]);
  const value = cache[PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP];

  try {
    assertBoundedInteger(value, VOLUME_HOTKEY_STEP_MIN, VOLUME_HOTKEY_STEP_MAX);
    return value;
  } catch {
    return undefined;
  }
};
