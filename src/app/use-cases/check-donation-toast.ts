import { PLUME_CACHE_KEYS } from "@/domain/browser";
import { PLUME_CONSTANTS } from "@/domain/plume";
import type { IBrowserCache } from "@/domain/ports/browser";

const { DONATION_THRESHOLDS } = PLUME_CONSTANTS;
const LAST_THRESHOLD = DONATION_THRESHOLDS[DONATION_THRESHOLDS.length - 1];
export const shouldShowDonationToast = (playCount: number): boolean => {
  if (playCount > LAST_THRESHOLD) return false;
  return DONATION_THRESHOLDS.includes(playCount);
};

export const getDonationPlayCount = async (cache: IBrowserCache): Promise<number> => {
  const result = await cache.get([PLUME_CACHE_KEYS.FULL_PLAY_COUNT]);
  return result[PLUME_CACHE_KEYS.FULL_PLAY_COUNT] ?? 0;
};
