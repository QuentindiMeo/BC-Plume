import { PLUME_CACHE_KEYS } from "../../domain/browser";
import { APP_VERSION, PLUME_CHANGELOG_URL } from "../../domain/meta";
import { PLUME_CONSTANTS } from "../../domain/plume";
import { browserActions } from "../../domain/ports/browser";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { PLUME_SVG } from "../../svg/icons";
import { getBrowserInstance } from "../stores/BrowserImpl";

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

const buildToastElement = (duration: number = PLUME_CONSTANTS.TOAST_AUTO_DISMISS): HTMLElement => {
  const toast = document.createElement("div");
  toast.className = "bpe-toast";
  toast.role = "status";
  toast.ariaLabel = getString("ARIA__TOAST__CONTAINER");
  toast.ariaLive = "polite";

  const icon = document.createElement("div");
  icon.className = "bpe-toast__icon";
  // SECURITY NOTE: PLUME_SVG.logo is a hardcoded compile-time constant — see svg/icons.ts
  icon.innerHTML = PLUME_SVG.logo;

  const body = document.createElement("div");
  body.className = "bpe-toast__body";

  const title = document.createElement("p");
  title.className = "bpe-toast__title";
  title.textContent = getString("LABEL__TOAST__UPDATE_AVAILABLE");

  const message = document.createElement("p");
  message.className = "bpe-toast__message";
  message.textContent = getString("LABEL__TOAST__VERSION", [APP_VERSION.slice(1)]);

  body.appendChild(title);
  body.appendChild(message);

  const cta = document.createElement("a");
  cta.className = "bpe-toast__cta";
  cta.href = PLUME_CHANGELOG_URL;
  cta.target = "_blank";
  cta.rel = "noopener noreferrer";
  cta.textContent = getString("LABEL__TOAST__VIEW_CHANGELOG");

  const dismiss = document.createElement("button");
  dismiss.className = "bpe-toast__dismiss";
  dismiss.type = "button";
  dismiss.ariaLabel = getString("ARIA__TOAST__DISMISS");
  dismiss.textContent = "×";
  dismiss.addEventListener("click", () => dismissVersionToast());

  const timer = document.createElement("div");
  timer.className = "bpe-toast__timer";
  timer.setAttribute("aria-hidden", "true");
  timer.style.setProperty("--toast-timer-duration", `${duration}s`);

  toast.appendChild(icon);
  toast.appendChild(body);
  toast.appendChild(cta);
  toast.appendChild(dismiss);
  toast.appendChild(timer);

  return toast;
};

export const showVersionToast = (): void => {
  if (toastElement) return;

  toastElement = buildToastElement();
  document.body.appendChild(toastElement);
  logger(CPL.INFO, getString("INFO__TOAST__SHOWN"));

  const totalDurationMs = PLUME_CONSTANTS.TOAST_AUTO_DISMISS * 1000;
  let remaining: number = totalDurationMs;
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
      const pct = (remaining / totalDurationMs) * 100;
      timer.style.setProperty("--timer-start-width", `${pct}%`);
      timer.style.setProperty("--toast-timer-duration", `${remaining / 1000}s`);
      timer.style.animation = "none";
      void timer.offsetHeight; // force reflow to restart animation
      timer.style.animation = "";
    }
  });
};

export const dismissVersionToast = (): void => {
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

  // Write APP_VERSION so the toast won't reappear until the next update
  const browser = getBrowserInstance();
  browser.dispatch(browserActions.setCacheValues([PLUME_CACHE_KEYS.LAST_SEEN_VERSION], [APP_VERSION]));
  logger(CPL.INFO, getString("INFO__TOAST__DISMISSED"));
};

// Called on SPA navigation or page unload. Removes the node without persisting
export const cleanupVersionToast = (): void => {
  clearAutoTimer();
  if (toastElement) {
    toastElement.remove();
    toastElement = null;
  }
};
