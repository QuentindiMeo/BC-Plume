import { createToast } from "@/app/features/ui/toast";
import { getBrowserInstance } from "@/app/stores/BrowserImpl";
import { getDonationPlayCount, shouldShowDonationToast } from "@/app/use-cases/check-donation-toast";
import { PLUME_CACHE_KEYS } from "@/domain/browser";
import { PLUME_DONATION_URL } from "@/domain/meta";
import { PLUME_CONSTANTS } from "@/domain/plume";
import type { IBrowserCache } from "@/domain/ports/browser";
import { browserActions } from "@/domain/ports/browser";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

const showDonationToast = (): void => {
  createToast({
    label: getString("META__TOAST__DONATION"),
    title: getString("LABEL__TOAST__DONATION__TITLE"),
    description: getString("LABEL__TOAST__DONATION__DESCRIPTION"),
    cta: { href: PLUME_DONATION_URL, label: getString("LABEL__TOAST__DONATION__CTA") },
    duration: PLUME_CONSTANTS.DONATION_TOAST_AUTO_DISMISS,
  });
};

export const checkAndShowDonationToast = async (cache: IBrowserCache): Promise<void> => {
  const playCount = await getDonationPlayCount(cache);

  const newPlayCount = playCount + 1;
  const browser = getBrowserInstance();
  browser.dispatch(browserActions.setCacheValues([PLUME_CACHE_KEYS.FULL_PLAY_COUNT], [newPlayCount]));
  logger(CPL.DEBUG, getString("DEBUG__DONATION__PLAY_COUNT__INCREMENTED", [String(newPlayCount)]));

  if (!shouldShowDonationToast(newPlayCount)) return;

  logger(CPL.DEBUG, getString("DEBUG__DONATION__THRESHOLD__REACHED", [String(newPlayCount)]));
  showDonationToast();
};
