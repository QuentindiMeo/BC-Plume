import { PLUME_CACHE_KEYS } from "@/domain/browser";
import {
  assertBoundedInteger,
  TRACKLIST_DROPDOWN_HEIGHT_MAX,
  TRACKLIST_DROPDOWN_HEIGHT_MIN,
  WholeNumber,
} from "@/domain/plume";
import { inferBrowserApi } from "@/shared/browser";

export const loadTracklistDropdownHeight = async (): Promise<WholeNumber | undefined> => {
  const browserApi = inferBrowserApi();

  const cache = await browserApi.storage.local.get([PLUME_CACHE_KEYS.TRACKLIST_DROPDOWN_HEIGHT]);
  const value = cache[PLUME_CACHE_KEYS.TRACKLIST_DROPDOWN_HEIGHT];

  try {
    assertBoundedInteger(value, TRACKLIST_DROPDOWN_HEIGHT_MIN, TRACKLIST_DROPDOWN_HEIGHT_MAX);
    return value;
  } catch {
    return undefined;
  }
};
