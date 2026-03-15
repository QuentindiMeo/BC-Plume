import { PLUME_CACHE_KEYS } from "../../domain/browser";
import { APP_VERSION, PLUME_CHANGELOG_URL } from "../../domain/meta";
import { PLUME_CONSTANTS } from "../../domain/plume";
import { browserActions } from "../../domain/ports/browser";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { PLUME_SVG } from "../../svg/icons";
import { getBrowserInstance } from "../stores/BrowserImpl";
import { createToast, ToastHandle } from "./ui/toast";

let releaseToastHandle: ToastHandle | null = null;

export const showReleaseToast = (): void => {
  if (releaseToastHandle) return;

  releaseToastHandle = createToast({
    label: getString("META__TOAST__RELEASE"),
    iconSvg: PLUME_SVG.logo,
    title: getString("LABEL__TOAST__RELEASE__TITLE"),
    description: getString("LABEL__TOAST__RELEASE__DESCRIPTION", [APP_VERSION.slice(1)]),
    cta: { href: PLUME_CHANGELOG_URL, label: getString("LABEL__TOAST__RELEASE__CTA") },
    onDismissed: () => {
      releaseToastHandle = null;

      // Write APP_VERSION so the toast won't reappear until the next release
      const browser = getBrowserInstance();
      browser.dispatch(browserActions.setCacheValues([PLUME_CACHE_KEYS.LAST_SEEN_RELEASE], [APP_VERSION]));
      logger(CPL.INFO, getString("INFO__RELEASE__PERSISTED"));
    },
    duration: PLUME_CONSTANTS.TOAST_AUTO_DISMISS,
  });
};

// Called on SPA navigation or page unload. Removes the node without persisting
export const cleanupReleaseToast = (): void => {
  releaseToastHandle?.cleanup();
  releaseToastHandle = null;
};
