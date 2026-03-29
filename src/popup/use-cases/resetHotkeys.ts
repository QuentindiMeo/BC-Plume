import { BANDCAMP_TAB_PATTERN, PLUME_CACHE_KEYS } from "@/domain/browser";
import { DEFAULT_HOTKEYS } from "@/domain/hotkeys";
import { PLUME_MESSAGE_TYPE } from "@/domain/messages";
import type { IMessageSender } from "@/domain/ports/messaging";
import { inferBrowserApi } from "@/shared/browser";

export const resetHotkeys = async (sender: IMessageSender): Promise<void> => {
  const browserApi = inferBrowserApi();

  await browserApi.storage.local.remove([PLUME_CACHE_KEYS.HOTKEY_BINDINGS]);

  await sender.broadcastToTabs(BANDCAMP_TAB_PATTERN, {
    type: PLUME_MESSAGE_TYPE.HOTKEYS_UPDATED,
    bindings: DEFAULT_HOTKEYS,
  });
};
