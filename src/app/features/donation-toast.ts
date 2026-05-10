import { createToast } from "@/app/features/ui/toast";
import { getBrowserInstance } from "@/app/stores/BrowserImpl";
import {
  getDonationDismissalCount,
  getDonationPlayCount,
  shouldShowDonationToast,
} from "@/app/use-cases/check-donation-toast";
import { PLUME_CACHE_KEYS } from "@/domain/browser";
import { PLUME_KOFI_URL } from "@/domain/meta";
import { PLUME_CONSTANTS } from "@/domain/plume";
import type { IBrowserCache } from "@/domain/ports/browser";
import { browserActions } from "@/domain/ports/browser";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

const showDonationToast = (dismissalCount: number): void => {
  createToast({
    label: getString("META__TOAST__DONATION"),
    title: getString("LABEL__TOAST__DONATION__TITLE"),
    description: getString("LABEL__TOAST__DONATION__DESCRIPTION"),
    cta: { href: PLUME_KOFI_URL, label: getString("LABEL__TOAST__DONATION__CTA") },
    duration: 120,
    onDismissed: () => {
      const newDismissalCount = dismissalCount + 1;
      const browser = getBrowserInstance();
      browser.dispatch(browserActions.setCacheValues([PLUME_CACHE_KEYS.DONATION_DISMISSAL_COUNT], [newDismissalCount]));
      logger(CPL.INFO, getString("INFO__DONATION__DISMISSAL__PERSISTED", [String(newDismissalCount)]));
    },
  });
};

export const checkAndShowDonationToast = async (cache: IBrowserCache): Promise<void> => {
  const [playCount, dismissalCount] = await Promise.all([
    getDonationPlayCount(cache),
    getDonationDismissalCount(cache),
  ]);

  const newPlayCount = playCount + 1;
  const browser = getBrowserInstance();
  browser.dispatch(browserActions.setCacheValues([PLUME_CACHE_KEYS.FULL_PLAY_COUNT], [newPlayCount]));
  logger(CPL.DEBUG, getString("DEBUG__DONATION__PLAY_COUNT__INCREMENTED", [String(newPlayCount)]));

  if (dismissalCount >= PLUME_CONSTANTS.DONATION_MAX_DISMISSALS) return;
  if (!shouldShowDonationToast(newPlayCount)) return;

  logger(CPL.DEBUG, getString("DEBUG__DONATION__THRESHOLD__REACHED", [String(newPlayCount)]));
  showDonationToast(dismissalCount);
};
