export interface ToastCta {
  href: string;
  label: string;
}

export interface ToastConfig {
  ariaLabel: string;
  iconSvg: string;
  title: string;
  message?: string;
  cta?: ToastCta;
  dismissAriaLabel: string;
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

const buildToastElement = (config: ToastConfig, onDismissClick: () => void): HTMLElement => {
  const toast = document.createElement("div");
  toast.className = "bpe-toast";
  toast.role = "status";
  toast.ariaLabel = config.ariaLabel;
  toast.ariaLive = "polite";

  const icon = document.createElement("div");
  icon.className = "bpe-toast__icon";
  // SECURITY NOTE: iconSvg must be a hardcoded compile-time constant — see svg/icons.ts
  icon.innerHTML = config.iconSvg;

  const body = document.createElement("div");
  body.className = "bpe-toast__body";

  const title = document.createElement("p");
  title.className = "bpe-toast__title";
  title.textContent = config.title;
  body.appendChild(title);

  if (config.message) {
    const message = document.createElement("p");
    message.className = "bpe-toast__message";
    message.textContent = config.message;
    body.appendChild(message);
  }

  const dismiss = document.createElement("button");
  dismiss.className = "bpe-toast__dismiss";
  dismiss.type = "button";
  dismiss.ariaLabel = config.dismissAriaLabel;
  dismiss.textContent = "×";
  dismiss.addEventListener("click", onDismissClick);

  const timer = document.createElement("div");
  timer.className = "bpe-toast__timer";
  timer.setAttribute("aria-hidden", "true");
  timer.style.setProperty("--toast-timer-duration", `${config.duration}s`);

  toast.appendChild(icon);
  toast.appendChild(body);

  if (config.cta) {
    const cta = document.createElement("a");
    cta.className = "bpe-toast__cta";
    cta.href = config.cta.href;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";
    cta.textContent = config.cta.label;
    toast.appendChild(cta);
  }

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
