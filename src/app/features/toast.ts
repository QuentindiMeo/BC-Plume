import { PLUME_CACHE_KEYS } from "../../domain/browser";
import { APP_VERSION, PLUME_CHANGELOG_URL } from "../../domain/meta";
import { PLUME_CONSTANTS } from "../../domain/plume";
import { browserActions } from "../../domain/ports/browser";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { PLUME_SVG } from "../../svg/icons";
import { getBrowserInstance } from "../stores/BrowserImpl";
import { buildToastElement } from "./ui/toast";

let toastElement: HTMLElement | null = null;
let timeoutId: ReturnType<typeof setTimeout> | null = null;

const clearAutoTimer = (): void => {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
};

const startAutoTimer = (remaining: number): void => {
  timeoutId = setTimeout(() => dismissVersionToast(), remaining);
};

const dismissVersionToast = (): void => {
  if (!toastElement) return;

  clearAutoTimer();

  const el = toastElement;
  el.classList.add("bpe-toast--exiting");

  el.addEventListener(
    "animationend",
    (e: AnimationEvent) => {
      if (e.animationName !== "bpe-toast-exit") return;
      el.remove();
      if (toastElement === el) toastElement = null;
    },
    { once: true }
  );

  logger(CPL.INFO, getString("INFO__TOAST__DISMISSED"));

  // Write APP_VERSION so the toast won't reappear until the next update
  const browser = getBrowserInstance();
  browser.dispatch(browserActions.setCacheValues([PLUME_CACHE_KEYS.LAST_SEEN_VERSION], [APP_VERSION]));
  logger(CPL.INFO, getString("INFO__VERSION__PERSISTED"));
};

const buildVersionToastElement = (): HTMLElement =>
  buildToastElement({
    ariaLabel: getString("ARIA__TOAST__CONTAINER"),
    iconSvg: PLUME_SVG.logo,
    title: getString("LABEL__TOAST__UPDATE_AVAILABLE"),
    message: getString("LABEL__TOAST__VERSION", [APP_VERSION.slice(1)]),
    cta: { href: PLUME_CHANGELOG_URL, label: getString("LABEL__TOAST__VIEW_CHANGELOG") },
    dismissAriaLabel: getString("ARIA__TOAST__DISMISS"),
    onDismiss: () => dismissVersionToast(),
    duration: PLUME_CONSTANTS.TOAST_AUTO_DISMISS,
  });

export const showVersionToast = (): void => {
  if (toastElement) return;

  toastElement = buildVersionToastElement();
  document.body.appendChild(toastElement);
  logger(CPL.INFO, getString("INFO__TOAST__SHOWN"));

  const toastDurationMs = PLUME_CONSTANTS.TOAST_AUTO_DISMISS * 1000;
  let remaining: number = toastDurationMs;
  let segmentStart = Date.now();

  startAutoTimer(remaining);

  toastElement.addEventListener("mouseenter", () => {
    remaining = Math.max(0, remaining - (Date.now() - segmentStart));
    clearAutoTimer();
    toastElement?.classList.add("bpe-toast--paused");
  });

  toastElement.addEventListener("mouseleave", () => {
    segmentStart = Date.now();
    toastElement?.classList.remove("bpe-toast--paused");
    startAutoTimer(remaining);

    const timer = toastElement?.querySelector(".bpe-toast__timer") as HTMLElement | null;
    if (timer) {
      const remainingPercentage = (remaining / toastDurationMs) * 100;
      timer.style.setProperty("--timer-start-width", `${remainingPercentage}%`);
      timer.style.setProperty("--toast-timer-duration", `${remaining / 1000}s`);
      timer.style.animation = "none";
      void timer.offsetHeight; // force reflow to restart animation
      timer.style.animation = "";
    }
  });
};

// Called on SPA navigation or page unload. Removes the node without persisting
export const cleanupVersionToast = (): void => {
  clearAutoTimer();
  if (toastElement) {
    toastElement.remove();
    toastElement = null;
  }
};
