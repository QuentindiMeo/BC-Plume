import { BANDCAMP_TAB_PATTERN, PLUME_CACHE_KEYS } from "@/domain/browser";
import { PLUME_MESSAGE_TYPE } from "@/domain/messages";
import {
  assertBoundedInteger,
  TRACK_RESTART_THRESHOLD_MAX,
  TRACK_RESTART_THRESHOLD_MIN,
  WholeNumber,
} from "@/domain/plume";
import type { IMessageSender } from "@/domain/ports/messaging";
import { inferBrowserApi } from "@/shared/browser";

export const saveTrackRestartThreshold = async (threshold: WholeNumber, sender: IMessageSender): Promise<void> => {
  assertBoundedInteger(threshold, TRACK_RESTART_THRESHOLD_MIN, TRACK_RESTART_THRESHOLD_MAX);

  const browserApi = inferBrowserApi();

  await browserApi.storage.local.set({ [PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD]: threshold });
  await sender.broadcastToTabs(BANDCAMP_TAB_PATTERN, {
    type: PLUME_MESSAGE_TYPE.TRACK_RESTART_THRESHOLD_UPDATED,
    trackRestartThreshold: threshold,
  });
};
