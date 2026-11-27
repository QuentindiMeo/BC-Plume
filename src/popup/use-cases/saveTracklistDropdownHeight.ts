import { BANDCAMP_TAB_PATTERN, PLUME_CACHE_KEYS } from "@/domain/browser";
import { PLUME_MESSAGE_TYPE } from "@/domain/messages";
import {
  assertBoundedInteger,
  TRACKLIST_DROPDOWN_HEIGHT_MAX,
  TRACKLIST_DROPDOWN_HEIGHT_MIN,
  WholeNumber,
} from "@/domain/plume";
import type { IMessageSender } from "@/domain/ports/messaging";
import { inferBrowserApi } from "@/shared/browser";

export const saveTracklistDropdownHeight = async (height: WholeNumber, sender: IMessageSender): Promise<void> => {
  assertBoundedInteger(height, TRACKLIST_DROPDOWN_HEIGHT_MIN, TRACKLIST_DROPDOWN_HEIGHT_MAX);

  const browserApi = inferBrowserApi();

  await browserApi.storage.local.set({ [PLUME_CACHE_KEYS.TRACKLIST_DROPDOWN_HEIGHT]: height });
  await sender.broadcastToTabs(BANDCAMP_TAB_PATTERN, {
    type: PLUME_MESSAGE_TYPE.TRACKLIST_DROPDOWN_HEIGHT_UPDATED,
    tracklistDropdownHeight: height,
  });
};
