import { APP_VERSION, PLUME_KO_FI_URL } from "../../domain/meta";
import { PLUME_CACHE_KEYS } from "../../domain/browser";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { PLUME_SVG } from "../../svg/icons";
import { getBrowserInstance } from "../stores/BrowserImpl";
import { browserActions } from "../../domain/ports/browser";
import { PLUME_CONSTANTS } from "../../domain/plume";

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

const buildToastElement = (): HTMLElement => {
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
  message.textContent = getString("LABEL__TOAST__VERSION", [APP_VERSION]);

  body.appendChild(title);
  body.appendChild(message);

  const cta = document.createElement("a");
  cta.className = "bpe-toast__cta";
  cta.href = PLUME_KO_FI_URL;
  cta.target = "_blank";
  cta.rel = "noopener noreferrer";
  cta.textContent = getString("LABEL__TOAST__VIEW_CHANGELOG");

  const dismiss = document.createElement("button");
  dismiss.className = "bpe-toast__dismiss";
  dismiss.type = "button";
  dismiss.ariaLabel = getString("ARIA__TOAST__DISMISS");
  dismiss.textContent = "×";
  dismiss.addEventListener("click", () => dismissVersionToast());

  toast.appendChild(icon);
  toast.appendChild(body);
  toast.appendChild(cta);
  toast.appendChild(dismiss);

  return toast;
};

export const showVersionToast = (): void => {
  if (toastElement) return;

  toastElement = buildToastElement();
  document.body.appendChild(toastElement);
  logger(CPL.INFO, getString("INFO__TOAST__SHOWN"));

  let remaining: number = PLUME_CONSTANTS.TOAST_AUTO_DISMISS_MS;
  let hoverStart = 0;

  startAutoTimer(remaining);

  toastElement.addEventListener("mouseenter", () => {
    clearAutoTimer();
    hoverStart = Date.now();
    toastElement?.classList.add("bpe-toast--paused");
  });

  toastElement.addEventListener("mouseleave", () => {
    const elapsed = Date.now() - hoverStart;
    remaining = Math.max(0, remaining - elapsed);
    toastElement?.classList.remove("bpe-toast--paused");
    startAutoTimer(remaining);
  });
};

export const dismissVersionToast = (): void => {
  if (!toastElement) return;

  clearAutoTimer();

  const el = toastElement;
  el.classList.add("bpe-toast--exiting");

  el.addEventListener(
    "animationend",
    () => {
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
