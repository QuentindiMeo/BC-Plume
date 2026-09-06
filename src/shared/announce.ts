import { getActiveLangTag } from "@/shared/i18n";

let liveRegion: HTMLDivElement | null = null;

const getLiveRegion = (): HTMLDivElement => {
  if (!liveRegion?.isConnected) {
    liveRegion = document.createElement("div");
    liveRegion.role = "status";
    liveRegion.ariaLive = "polite";
    liveRegion.className = "sr-live";
    liveRegion.lang = getActiveLangTag();
    document.body.appendChild(liveRegion);
  }
  return liveRegion;
};

// ? Announces `message` to screen readers via a shared `role="status"` live region.
export const announce = (message: string): void => {
  const region = getLiveRegion();

  // ? Clear then set, one frame apart: ensures re-announcement even if the same message is sent
  // ? twice, and — since the region is already in the accessibility tree before either write —
  // ? avoids the "filled while hidden/unobserved" failure mode this same pattern fixes elsewhere.
  region.textContent = "";
  requestAnimationFrame(() => {
    region.textContent = message;
  });
};
