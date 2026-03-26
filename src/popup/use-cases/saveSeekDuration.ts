import { PLUME_CACHE_KEYS } from "../../domain/browser";
import { ValidSeekDuration } from "../../domain/plume";
import type { IMessageSender } from "../../domain/ports/messaging";
import { inferBrowserApi } from "../../shared/browser";
import { PLUME_MESSAGE_TYPE } from "../../shared/messages";

export const saveSeekDuration = async (duration: ValidSeekDuration, sender: IMessageSender): Promise<void> => {
  const browserApi = inferBrowserApi();

  await browserApi.storage.local.set({ [PLUME_CACHE_KEYS.SEEK_DURATION]: duration });

  await sender.broadcastToTabs("*://*.bandcamp.com/*", {
    type: PLUME_MESSAGE_TYPE.SEEK_DURATION_UPDATED,
    seekDuration: duration,
  });
};
