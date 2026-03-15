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
  onDismiss: () => void;
  duration: number; // in seconds
}

export const buildToastElement = (config: ToastConfig): HTMLElement => {
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
  dismiss.addEventListener("click", config.onDismiss);

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
