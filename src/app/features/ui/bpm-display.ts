import { getTrackAudioInstance } from "@/app/stores/adapters";
import { getAppCoreInstance } from "@/app/stores/AppCoreImpl";
import { detectBpmForAllTracks } from "@/app/use-cases/detect-bpm";
import type { TrackBpmEntry } from "@/domain/ports/app-core";
import type { TrackAudioInfo } from "@/domain/ports/track-audio";
import { PLUME_ELEM_SELECTORS } from "@/infra/elements/plume";
import { getString } from "@/shared/i18n";

const BADGE_CLASS = PLUME_ELEM_SELECTORS.bpmBadge.split(".")[1];
const syncTracklistBpmBadges = (
  trackBpms: Record<string, TrackBpmEntry>,
  speed: number,
  infos: TrackAudioInfo[]
): void => {
  if (infos.length === 0) return;

  // Build trackNumber→trackUrl map (trackNumber is 1-based, tracklist idx is 0-based)
  const numToUrl = new Map<number, string>();
  for (const info of infos) numToUrl.set(info.trackNumber, info.trackUrl);

  const items = document.querySelectorAll<HTMLElement>(PLUME_ELEM_SELECTORS.tracklistItem);
  items.forEach((item) => {
    const idx = Number(item.dataset["index"]);
    const trackUrl = numToUrl.get(idx + 1);
    const entry = trackUrl ? trackBpms[trackUrl] : undefined;

    let badge = item.querySelector<HTMLElement>(`.${BADGE_CLASS}`);
    if (!entry) {
      if (badge) badge.remove();
      return;
    }

    if (!badge) {
      badge = document.createElement("span");
      badge.className = BADGE_CLASS;
      badge.ariaHidden = "true";
      item.appendChild(badge);
    }

    badge.classList.remove("detecting", "error");
    badge.ariaHidden = "true";
    badge.ariaLabel = null;
    if (entry.loading) {
      badge.textContent = getString("LABEL__BPM__DETECTING");
      badge.classList.add("detecting");
    } else if (entry.error) {
      badge.textContent = getString("LABEL__BPM__ERROR");
      badge.classList.add("error");
    } else if (entry.bpm !== null) {
      const adjusted = Math.round(entry.bpm * speed * 10) / 10;
      badge.textContent = `${adjusted}`;
      badge.ariaLabel = getString("ARIA__BPM__BADGE", [String(adjusted)]);
      badge.ariaHidden = "false";
    }
  });
};

const updateBpmElement = (el: HTMLElement, entry: TrackBpmEntry | undefined, speed: number): void => {
  el.classList.remove("detecting", "error");

  if (!entry) {
    el.textContent = "—";
    return;
  }

  if (entry.loading) {
    el.textContent = getString("LABEL__BPM__DETECTING");
    el.classList.add("detecting");
  } else if (entry.error) {
    el.textContent = getString("LABEL__BPM__ERROR");
    el.classList.add("error");
  } else if (entry.bpm !== null) {
    const adjusted = Math.round(entry.bpm * speed * 10) / 10;
    el.textContent = String(adjusted);
    el.ariaLabel = getString("ARIA__BPM__BADGE", [String(adjusted)]);
  }
};

const resolveCurrentTrackUrl = (infos: TrackAudioInfo[]): string | null => {
  // Single-track page: only one entry
  if (infos.length === 1) return infos[0].trackUrl;

  // Album page: match by current track number from store
  const appCore = getAppCoreInstance();
  const trackNumberText = appCore.getState().trackNumber;
  if (!trackNumberText) return null;

  // trackNumber in store is like "3/12", extract the current number
  const match = trackNumberText.match(/(\d+)/);
  if (!match) return null;

  const currentNum = Number(match[1]);
  const info = infos.find((i) => i.trackNumber === currentNum);
  return info?.trackUrl ?? null;
};
/** Update the main BPM value display and tracklist badges. */
export const syncBpmDisplay = (trackBpms: Record<string, TrackBpmEntry>): void => {
  const appCore = getAppCoreInstance();
  const speed = appCore.getState().playbackSpeed;
  const infos = getTrackAudioInstance().getTrackAudioInfos();

  // Update main BPM display for current track
  const currentUrl = resolveCurrentTrackUrl(infos);
  const valueEl = document.querySelector<HTMLElement>(PLUME_ELEM_SELECTORS.bpmValue);
  if (valueEl) {
    const entry = currentUrl ? trackBpms[currentUrl] : undefined;
    updateBpmElement(valueEl, entry, speed);
  }

  // Update tracklist badges
  syncTracklistBpmBadges(trackBpms, speed, infos);
};

export const createBpmDisplaySection = (isAlbumPage: boolean): HTMLDivElement => {
  const container = document.createElement("div");
  container.id = PLUME_ELEM_SELECTORS.bpmContainer.split("#")[1];

  const label = document.createElement("span");
  label.id = PLUME_ELEM_SELECTORS.bpmLabel.split("#")[1];
  label.textContent = getString("LABEL__BPM__DISPLAY");
  label.ariaHidden = "true";
  container.appendChild(label);

  const value = document.createElement("span");
  value.id = PLUME_ELEM_SELECTORS.bpmValue.split("#")[1];
  value.textContent = "—";
  value.ariaLabel = getString("ARIA__BPM__DISPLAY");
  container.appendChild(value);

  if (isAlbumPage) {
    const detectAllBtn = document.createElement("button");
    detectAllBtn.id = PLUME_ELEM_SELECTORS.bpmDetectAllBtn.split("#")[1];
    detectAllBtn.type = "button";
    detectAllBtn.textContent = getString("LABEL__BPM__DETECT_ALL");
    detectAllBtn.ariaLabel = getString("ARIA__BPM__DETECT_ALL_BTN");
    detectAllBtn.addEventListener("click", () => {
      if (detectAllBtn.disabled) return;
      detectAllBtn.disabled = true;

      detectBpmForAllTracks().finally(() => {
        detectAllBtn.disabled = false;
      });
    });
    container.appendChild(detectAllBtn);
  }

  return container;
};
