import { PLUME_CACHE_KEYS } from "../../domain/browser";
import { KeyBindingMap } from "../../domain/hotkeys";
import { inferBrowserApi } from "../../shared/browser";

export const loadHotkeys = async (): Promise<KeyBindingMap | undefined> => {
  const browserApi = inferBrowserApi();
  const result = await browserApi.storage.local.get([PLUME_CACHE_KEYS.HOTKEY_BINDINGS]);
  return result[PLUME_CACHE_KEYS.HOTKEY_BINDINGS] as KeyBindingMap | undefined;
};
