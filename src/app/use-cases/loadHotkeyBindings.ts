import { DEFAULT_HOTKEYS, HotkeyAction, KeyBinding, KeyBindingMap } from "../../domain/hotkeys";
import { PLUME_CACHE_KEYS } from "../../domain/browser";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { inferBrowserApi } from "../../shared/browser";

export const loadHotkeyBindings = async (): Promise<Record<HotkeyAction, KeyBinding>> => {
  let stored: KeyBindingMap | undefined;

  try {
    const browserApi = inferBrowserApi();
    const result = await browserApi.storage.local.get([PLUME_CACHE_KEYS.HOTKEY_BINDINGS]);

    stored = result[PLUME_CACHE_KEYS.HOTKEY_BINDINGS] as KeyBindingMap | undefined;
  } catch {
    logger(CPL.WARN, getString("WARN__HOTKEYS__STORAGE_UNAVAILABLE"));
    return { ...DEFAULT_HOTKEYS };
  }

  if (!stored) return { ...DEFAULT_HOTKEYS };

  // Stored bindings override defaults; actions absent from storage keep their default binding
  return Object.fromEntries(
    (Object.keys(DEFAULT_HOTKEYS) as HotkeyAction[]).map((action) => [
      action,
      stored![action] ?? DEFAULT_HOTKEYS[action],
    ])
  ) as Record<HotkeyAction, KeyBinding>;
};
