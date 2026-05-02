import { PLUME_CONSTANTS } from "@/domain/plume";
import { getActiveLocale, getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";
import { createSafeSvgElement } from "@/shared/svg";
import { PLUME_SVG } from "@/svg/icons";

export interface ToastCta {
  href: string;
  label: string;
}

const getToastBorderColor = (borderType: ToastBorderType): string => {
  switch (borderType) {
    case "default":
      return "var(--color-plume)";
    case "warning":
      return "var(--color-plume-warning)";
    case "error":
      return "var(--color-plume-error)";
    default:
      borderType satisfies never; // exhaustiveness check
      return borderType; // allow custom CSS color values
  }
};
export type ToastBorderType = "default" | "warning" | "error"; // string allows custom CSS color values

export interface ToastConfig {
  label: string; // short identifier used for ARIA construction and logging
  title: string;
  description?: string;
  iconSvg?: SVGElement | PLUME_SVG;
  duration?: number; // in seconds, defaults to PLUME_CONSTANTS.TOAST_AUTO_DISMISS
  cta?: ToastCta;
  onDismissed?: () => void; // side-effect callback, called after the toast is dismissed
  borderType?: ToastBorderType; // CSS color for the left border, defaults to var(--color-plume)
}

export interface ToastHandle {
  dismiss: () => void; // animate out, then call onDismissed
  cleanup: () => void; // remove immediately without side effects (SPA nav / unload)
}

const getToastContainer = (): HTMLElement => {
  const existing = document.getElementById("plume-toast-container");
  if (existing) return existing;

  const container = document.createElement("div");
  container.id = "plume-toast-container";
  container.lang = getActiveLocale() || document.documentElement.lang || "en";
  document.body.appendChild(container);
  return container;
};
const buildToastElement = (config: ToastConfig, onDismissClick: () => void): HTMLElement => {
  const toast = document.createElement("div");
  toast.className = "plume-toast";
  toast.role = "status";
  toast.ariaLabel = getString("ARIA__TOAST__CONTAINER", [config.label]);
  toast.ariaLive = "polite";
  const toastBorderColor = getToastBorderColor(config.borderType ?? "default");
  toast.style.setProperty("border-left-width", "4px");
  toast.style.setProperty("border-left-style", "solid");
  toast.style.setProperty("border-left-color", toastBorderColor);

  const icon = document.createElement("div");
  icon.className = "plume-toast__icon";
  if (config.iconSvg instanceof SVGElement) {
    icon.appendChild(config.iconSvg.cloneNode(true));
  } else if (config.iconSvg !== undefined) {
    const svgElement = createSafeSvgElement(config.iconSvg);
    if (svgElement) icon.appendChild(svgElement);
    else logger(CPL.WARN, getString("WARN__TOAST__ICON_SVG_INVALID", [config.label]));
  } else {
    const svgElement = createSafeSvgElement(PLUME_SVG.logo);
    if (svgElement) icon.appendChild(svgElement);
  }

  const body = document.createElement("div");
  body.className = "plume-toast__body";

  const title = document.createElement("p");
  title.className = "plume-toast__title";
  title.textContent = config.title;
  body.appendChild(title);

  if (config.description) {
    const message = document.createElement("p");
    message.className = "plume-toast__description";
    message.textContent = config.description;
    body.appendChild(message);
  }

  if (config.cta) {
    const cta = document.createElement("a");
    cta.className = "plume-toast__cta";
    cta.href = config.cta.href;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";
    cta.textContent = config.cta.label;
    body.appendChild(cta);
  }

  const dismiss = document.createElement("button");
  dismiss.className = "plume-toast__dismiss";
  dismiss.type = "button";
  dismiss.ariaLabel = getString("ARIA__TOAST__DISMISS", [config.label]);
  dismiss.textContent = "×";
  dismiss.addEventListener("click", onDismissClick);

  const timer = document.createElement("div");
  timer.className = "plume-toast__timer";
  timer.ariaHidden = "true";
  timer.style.setProperty("--toast-timer-duration", `${config.duration ?? PLUME_CONSTANTS.TOAST_AUTO_DISMISS}s`);

  toast.appendChild(icon);
  toast.appendChild(body);

  toast.appendChild(dismiss);
  toast.appendChild(timer);

  return toast;
};

export const createToast = (config: ToastConfig): ToastHandle => {
  const container = getToastContainer();
  const durationMs = (config.duration ?? PLUME_CONSTANTS.TOAST_AUTO_DISMISS) * 1000;
  let remaining = durationMs;
  let segmentStart = Date.now();
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let dismissed = false;

  const clearTimer = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const dismiss = (): void => {
    if (dismissed) return;
    dismissed = true;
    clearTimer();
    el.classList.add("plume-toast--exiting");

    const onExitEnd = (e: AnimationEvent): void => {
      if (e.animationName !== "plume-toast-exit") return;
      el.removeEventListener("animationend", onExitEnd);
      el.remove();
      if (container.children.length === 0) container.remove();
    };
    el.addEventListener("animationend", onExitEnd);

    logger(CPL.INFO, getString("INFO__TOAST__DISMISSED", [config.label]));
    config.onDismissed?.();
  };

  const cleanup = (): void => {
    if (dismissed) return;
    dismissed = true;
    clearTimer();
    el.remove();
    if (container.children.length === 0) container.remove();
  };

  const el = buildToastElement(config, dismiss);
  container.appendChild(el);
  logger(CPL.INFO, getString("INFO__TOAST__SHOWN", [config.label]));

  timerId = setTimeout(() => dismiss(), remaining);

  el.addEventListener("mouseenter", () => {
    remaining = Math.max(0, remaining - (Date.now() - segmentStart));
    clearTimer();
    el.classList.add("plume-toast--paused");
  });

  el.addEventListener("mouseleave", () => {
    segmentStart = Date.now();
    el.classList.remove("plume-toast--paused");
    timerId = setTimeout(() => dismiss(), remaining);

    const timer = el.querySelector(".plume-toast__timer") as HTMLElement | null;
    if (timer) {
      const progressionPercentage = (remaining / durationMs) * 100;
      timer.style.setProperty("--timer-start-width", `${progressionPercentage}%`);
      timer.style.setProperty("--toast-timer-duration", `${remaining / 1000}s`);
      timer.style.animation = "none";
      void timer.offsetHeight; // force reflow to restart animation
      timer.style.animation = "";
    }
  });

  return { dismiss, cleanup };
};
