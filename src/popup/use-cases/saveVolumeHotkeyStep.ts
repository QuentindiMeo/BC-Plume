import { BANDCAMP_TAB_PATTERN, PLUME_CACHE_KEYS } from "@/domain/browser";
import { PLUME_MESSAGE_TYPE } from "@/domain/messages";
import { assertBoundedInteger, VOLUME_HOTKEY_STEP_MAX, VOLUME_HOTKEY_STEP_MIN, WholeNumber } from "@/domain/plume";
import type { IMessageSender } from "@/domain/ports/messaging";
import { inferBrowserApi } from "@/shared/browser";

export const saveVolumeHotkeyStep = async (step: WholeNumber, sender: IMessageSender): Promise<void> => {
  assertBoundedInteger(step, VOLUME_HOTKEY_STEP_MIN, VOLUME_HOTKEY_STEP_MAX);

  const browserApi = inferBrowserApi();

  await browserApi.storage.local.set({ [PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP]: step });
  await sender.broadcastToTabs(BANDCAMP_TAB_PATTERN, {
    type: PLUME_MESSAGE_TYPE.VOLUME_HOTKEY_STEP_UPDATED,
    volumeHotkeyStep: step,
  });
};
