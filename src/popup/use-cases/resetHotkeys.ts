import { PLUME_CACHE_KEYS } from "../../domain/browser";
import { DEFAULT_HOTKEYS } from "../../domain/hotkeys";
import type { IMessageSender } from "../../domain/ports/messaging";
import { inferBrowserApi } from "../../shared/browser";
import { PLUME_MESSAGE_TYPE } from "../../domain/messages";

export const resetHotkeys = async (sender: IMessageSender): Promise<void> => {
  const browserApi = inferBrowserApi();

  await browserApi.storage.local.remove([PLUME_CACHE_KEYS.HOTKEY_BINDINGS]);

  await sender.broadcastToTabs("*://*.bandcamp.com/*", {
    type: PLUME_MESSAGE_TYPE.HOTKEYS_UPDATED,
    bindings: DEFAULT_HOTKEYS,
  });
};
