import { PLUME_CACHE_KEYS } from "../../domain/browser";
import { HotkeyAction, KeyBinding, KeyBindingMap } from "../../domain/hotkeys";
import type { IMessageSender } from "../../domain/ports/messaging";
import { inferBrowserApi } from "../../shared/browser";
import { PLUME_MESSAGE_TYPE } from "../../domain/messages";

export const saveHotkeys = async (bindings: KeyBindingMap, sender: IMessageSender): Promise<void> => {
  const browserApi = inferBrowserApi();

  await browserApi.storage.local.set({ [PLUME_CACHE_KEYS.HOTKEY_BINDINGS]: bindings });

  await sender.broadcastToTabs("*://*.bandcamp.com/*", {
    type: PLUME_MESSAGE_TYPE.HOTKEYS_UPDATED,
    bindings: bindings as Record<HotkeyAction, KeyBinding>,
  });
};
