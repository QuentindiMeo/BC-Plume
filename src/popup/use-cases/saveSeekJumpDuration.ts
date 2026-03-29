import { BANDCAMP_TAB_PATTERN, PLUME_CACHE_KEYS } from "@/domain/browser";
import { PLUME_MESSAGE_TYPE } from "@/domain/messages";
import { assertBoundedInteger, SEEK_JUMP_DURATION_MAX, SEEK_JUMP_DURATION_MIN, WholeNumber } from "@/domain/plume";
import type { IMessageSender } from "@/domain/ports/messaging";
import { inferBrowserApi } from "@/shared/browser";

export const saveSeekJumpDuration = async (duration: WholeNumber, sender: IMessageSender): Promise<void> => {
  assertBoundedInteger(duration, SEEK_JUMP_DURATION_MIN, SEEK_JUMP_DURATION_MAX);

  const browserApi = inferBrowserApi();

  await browserApi.storage.local.set({ [PLUME_CACHE_KEYS.SEEK_JUMP_DURATION]: duration });
  await sender.broadcastToTabs(BANDCAMP_TAB_PATTERN, {
    type: PLUME_MESSAGE_TYPE.SEEK_JUMP_DURATION_UPDATED,
    seekJumpDuration: duration,
  });
};
