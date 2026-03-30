import { PLUME_CACHE_KEYS } from "@/domain/browser";
import { assertBoundedInteger, SEEK_JUMP_DURATION_MAX, SEEK_JUMP_DURATION_MIN, WholeNumber } from "@/domain/plume";
import { inferBrowserApi } from "@/shared/browser";

export const loadSeekJumpDuration = async (): Promise<WholeNumber | undefined> => {
  const browserApi = inferBrowserApi();

  const cache = await browserApi.storage.local.get([PLUME_CACHE_KEYS.SEEK_JUMP_DURATION]);
  const value = cache[PLUME_CACHE_KEYS.SEEK_JUMP_DURATION];

  try {
    assertBoundedInteger(value, SEEK_JUMP_DURATION_MIN, SEEK_JUMP_DURATION_MAX);
    return value;
  } catch {
    return undefined;
  }
};
