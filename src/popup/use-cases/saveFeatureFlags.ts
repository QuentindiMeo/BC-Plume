import { BANDCAMP_TAB_PATTERN, PLUME_CACHE_KEYS } from "@/domain/browser";
import { PLUME_MESSAGE_TYPE } from "@/domain/messages";
import { FeatureFlags } from "@/domain/plume";
import type { IMessageSender } from "@/domain/ports/messaging";
import { inferBrowserApi } from "@/shared/browser";

export const saveFeatureFlags = async (flags: FeatureFlags, sender: IMessageSender) => {
  const browserApi = inferBrowserApi();

  await browserApi.storage.local.set({ [PLUME_CACHE_KEYS.FEATURE_FLAGS]: flags });
  await sender.broadcastToTabs(BANDCAMP_TAB_PATTERN, {
    type: PLUME_MESSAGE_TYPE.FEATURE_FLAGS_UPDATED,
    featureFlags: flags,
  });
};
