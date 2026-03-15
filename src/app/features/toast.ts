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
    ariaLabel: getString("ARIA__TOAST__CONTAINER"),
    iconSvg: PLUME_SVG.logo,
    title: getString("LABEL__TOAST__UPDATE_AVAILABLE"),
    message: getString("LABEL__TOAST__RELEASE", [APP_VERSION.slice(1)]),
    cta: { href: PLUME_CHANGELOG_URL, label: getString("LABEL__TOAST__VIEW_CHANGELOG") },
    dismissAriaLabel: getString("ARIA__TOAST__DISMISS"),
    onDismissed: () => {
      releaseToastHandle = null;
      logger(CPL.INFO, getString("INFO__TOAST__DISMISSED"));

      // Write APP_VERSION so the toast won't reappear until the next release
      const browser = getBrowserInstance();
      browser.dispatch(browserActions.setCacheValues([PLUME_CACHE_KEYS.LAST_SEEN_RELEASE], [APP_VERSION]));
      logger(CPL.INFO, getString("INFO__RELEASE__PERSISTED"));
    },
    duration: PLUME_CONSTANTS.TOAST_AUTO_DISMISS,
  });

  logger(CPL.INFO, getString("INFO__TOAST__SHOWN"));
};

// Called on SPA navigation or page unload. Removes the node without persisting
export const cleanupReleaseToast = (): void => {
  releaseToastHandle?.cleanup();
  releaseToastHandle = null;
};
