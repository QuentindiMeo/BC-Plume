import { getString } from "../../../shared/i18n";
import { CPL, logger } from "../../../shared/logger";

export interface ToastCta {
  href: string;
  label: string;
}

export interface ToastConfig {
  label: string; // short identifier used for ARIA construction and logging
  iconSvg: string | SVGElement; // SECURITY NOTE: must be a hardcoded compile-time constant — see svg/icons.ts
  title: string;
  description?: string;
  cta?: ToastCta;
  onDismissed?: () => void; // side-effect callback, called after the toast is dismissed
  duration: number; // in seconds
}

export interface ToastHandle {
  dismiss: () => void; // animate out, then call onDismissed
  cleanup: () => void; // remove immediately without side effects (SPA nav / unload)
}

const getToastContainer = (): HTMLElement => {
  const existing = document.getElementById("bpe-toast-container");
  if (existing) return existing;

  const container = document.createElement("div");
  container.id = "bpe-toast-container";
  document.body.appendChild(container);
  return container;
};
const createSafeSvgElement = (svgMarkup: string): SVGElement | null => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgMarkup, "image/svg+xml");
    const root = doc.documentElement;
    if (!(root instanceof SVGElement) || root.nodeName.toLowerCase() !== "svg") {
      return null;
    }

    // Remove potentially dangerous elements:
    // - script/foreignObject: obvious injection vectors
    // - a: makes content clickable with arbitrary href
    // - animate/set/animateMotion/animateTransform: can dynamically rewrite href attributes
    root
      .querySelectorAll("script,foreignObject,a,animate,set,animateMotion,animateTransform")
      .forEach((el) => el.remove());

    // Strip inline event handlers (on*) and external resource references from all elements.
    const UNSAFE_HREF_RE = /^(javascript:|data:|https?:\/\/)/i;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

    let current = walker.currentNode as Element | null;
    while (current) {
      Array.from(current.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on")) {
          current!.removeAttribute(attr.name);
        } else if (name === "href" || name === "xlink:href") {
          if (UNSAFE_HREF_RE.test(attr.value)) current!.removeAttribute(attr.name);
        }
      });
      if (!walker.nextNode()) break;
      current = walker.currentNode as Element | null;
    }
    return root;
  } catch (e) {
    logger(CPL.WARN, getString("WARN__TOAST__SVG_PARSE_FAILED"), e);
    return null;
  }
};

const buildToastElement = (config: ToastConfig, onDismissClick: () => void): HTMLElement => {
  const toast = document.createElement("div");
  toast.className = "bpe-toast";
  toast.role = "status";
  toast.ariaLabel = getString("ARIA__TOAST__CONTAINER", [config.label]);
  toast.ariaLive = "polite";

  const icon = document.createElement("div");
  icon.className = "bpe-toast__icon";
  if (config.iconSvg instanceof SVGElement) {
    icon.appendChild(config.iconSvg);
  } else {
    const svgElement = createSafeSvgElement(config.iconSvg);
    if (svgElement) icon.appendChild(svgElement);
    else logger(CPL.WARN, getString("WARN__TOAST__ICON_SVG_INVALID", [config.label]));
  }

  const body = document.createElement("div");
  body.className = "bpe-toast__body";

  const title = document.createElement("p");
  title.className = "bpe-toast__title";
  title.textContent = config.title;
  body.appendChild(title);

  if (config.description) {
    const message = document.createElement("p");
    message.className = "bpe-toast__description";
    message.textContent = config.description;
    body.appendChild(message);
  }

  if (config.cta) {
    const cta = document.createElement("a");
    cta.className = "bpe-toast__cta";
    cta.href = config.cta.href;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";
    cta.textContent = config.cta.label;
    body.appendChild(cta);
  }

  const dismiss = document.createElement("button");
  dismiss.className = "bpe-toast__dismiss";
  dismiss.type = "button";
  dismiss.ariaLabel = getString("ARIA__TOAST__DISMISS", [config.label]);
  dismiss.textContent = "×";
  dismiss.addEventListener("click", onDismissClick);

  const timer = document.createElement("div");
  timer.className = "bpe-toast__timer";
  timer.setAttribute("aria-hidden", "true");
  timer.style.setProperty("--toast-timer-duration", `${config.duration}s`);

  toast.appendChild(icon);
  toast.appendChild(body);

  toast.appendChild(dismiss);
  toast.appendChild(timer);

  return toast;
};

export const createToast = (config: ToastConfig): ToastHandle => {
  const container = getToastContainer();
  const durationMs = config.duration * 1000;
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
    el.classList.add("bpe-toast--exiting");
    el.addEventListener(
      "animationend",
      (e: AnimationEvent) => {
        if (e.animationName !== "bpe-toast-exit") return;
        el.remove();
        if (container.children.length === 0) container.remove();
      },
      { once: true }
    );
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
    el.classList.add("bpe-toast--paused");
  });

  el.addEventListener("mouseleave", () => {
    segmentStart = Date.now();
    el.classList.remove("bpe-toast--paused");
    timerId = setTimeout(() => dismiss(), remaining);

    const timer = el.querySelector(".bpe-toast__timer") as HTMLElement | null;
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
