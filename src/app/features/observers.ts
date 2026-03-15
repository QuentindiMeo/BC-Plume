import { LOOP_MODE } from "../../domain/plume";
import { guiActions } from "../../domain/ports/plume-ui";
import { PLUME_ELEM_SELECTORS } from "../../infra/elements/plume";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { getBcPlayerInstance } from "../stores/adapters";
import { getAppCoreInstance } from "../stores/AppCoreImpl";
import { getGuiInstance } from "../stores/GuiImpl";
import { isLastTrackOfAlbumPlaying } from "../use-cases/navigate-track";
import { updateTrackMetadata } from "../use-cases/update-track-metadata";
import { setupAudioEventListeners } from "./audio-events";
import { cleanupFullscreenMode, toggleFullscreenMode } from "./fullscreen";
import { cleanupVersionToast } from "./toast";
import { setupHotkeys } from "./keyboard";
import { loadHotkeyBindings } from "../use-cases/loadHotkeyBindings";
import { setupStoreSubscriptions } from "./store-subscriptions";
import { CleanupCallback } from "./types";
import {
  handleMuteToggle,
  handlePlayPause,
  handleTimeBackward,
  handleTimeForward,
  handleTrackBackward,
  handleTrackForward,
  setupPlayerStickiness,
} from "./ui";
import { handleLoopCycle } from "./ui/loop";

// Runs before GUI store is populated, queries the DOM directly.
// All other code should read from the store instead of using querySelector on Plume selectors.
export const isPlumeInjected = (): boolean => !!document.querySelector(PLUME_ELEM_SELECTORS.plumeContainer);

export const updateTrackForwardBtnState = () => {
  const bcPlayer = getBcPlayerInstance();
  const appCore = getAppCoreInstance();
  const plume = getGuiInstance().getState();
  const trackFwdBtns = plume.trackFwdBtns;
  if (trackFwdBtns.length === 0) return;

  const isNotLooping = appCore.getState().loopMode === LOOP_MODE.NONE;
  const pageType = appCore.getState().pageType;
  const shouldDisable = isNotLooping && (isLastTrackOfAlbumPlaying(bcPlayer) || pageType === "track");
  trackFwdBtns.forEach((btn) => (btn.disabled = shouldDisable));
};

const updateTrackDisplay = () => {
  const appCore = getAppCoreInstance();
  const plumeUi = getGuiInstance();
  const plume = plumeUi.getState();

  const bcPlayer = getBcPlayerInstance();
  const { trackTitle: newTrackTitle, trackNumberText, current, total } = updateTrackMetadata(appCore, bcPlayer);

  const titleText = plume.titleDisplay?.querySelector(PLUME_ELEM_SELECTORS.headerTitle) as HTMLSpanElement;
  const preText = plume.titleDisplay?.querySelector(PLUME_ELEM_SELECTORS.headerTitlePretext) as HTMLSpanElement;

  const isAlbumPage = appCore.getState().pageType === "album";

  if (titleText) {
    titleText.textContent = newTrackTitle;
    titleText.title = newTrackTitle; // allow the user to see the full title on hover, in case the title is truncated

    // Cache offsetHeight to avoid multiple layout recalculations
    const LOGO_DEFAULT_VERTICAL_PADDING = 1; // in rem, from `styles.css`
    // Expected single-line height for Latin characters in px. Used as baseline to calculate additional padding needed when title wraps to multiple lines or uses taller character sets.
    const LATIN_CHAR_HEIGHT = 19;
    const titleHeight = titleText.offsetHeight;
    if (titleHeight !== LATIN_CHAR_HEIGHT) {
      const logo = plume.headerLogo;
      if (logo) {
        const deltaPaddingPx = titleHeight - LATIN_CHAR_HEIGHT;
        const deltaPaddingRem = deltaPaddingPx / 16; // 16px = 1rem
        logo.style.paddingTop = `${LOGO_DEFAULT_VERTICAL_PADDING + deltaPaddingRem}rem`;
      }
    }
  }

  if (preText) {
    preText.textContent = trackNumberText;

    const headerCurrent = plume.titleDisplay?.querySelector(PLUME_ELEM_SELECTORS.headerCurrent) as HTMLDivElement;
    if (headerCurrent) {
      headerCurrent.ariaLabel = isAlbumPage
        ? getString("ARIA__TRACK_CURRENT", [String(current), String(total), newTrackTitle])
        : getString("ARIA__TRACK", [newTrackTitle]);
    }
  }
};

// Holds all active cleanup callbacks so observers and the unload handler can reach them
export interface CleanupHandles {
  audioEvents: CleanupCallback | null;
  storeSubscriptions: CleanupCallback | null;
  hotkeys: CleanupCallback | null;
  stickiness: CleanupCallback | null;
  toast: CleanupCallback | null;
}

// Wires audio event listeners and updates handles in-place. This avoids leaking listeners of the old element.
// Re-setup audio event listeners: cleanup old → update store → attach new
const rewireAudioEventListeners = (handles: CleanupHandles, newAudio?: HTMLAudioElement): void => {
  handles.audioEvents?.();
  handles.audioEvents = null;

  if (newAudio) {
    const plumeUi = getGuiInstance();
    plumeUi.dispatch(guiActions.setAudioElement(newAudio));
  }

  handles.audioEvents = setupAudioEventListeners({
    updateTrackDisplay,
    updateTrackForwardBtnState,
  });
};

const applyPersistedVolume = (audio: HTMLAudioElement): void => {
  const appCore = getAppCoreInstance();
  const volume = appCore.getState().volume;
  audio.volume = volume;
  logger(
    CPL.INFO,
    getString("INFO__VOLUME__APPLIED", [String(Math.round(volume * 100)), getString("META__PERCENTAGE")])
  );
};

// Registers all post-injection listeners and stores their teardown callbacks
export const setupListeners = async (handles: CleanupHandles): Promise<void> => {
  handles.stickiness = setupPlayerStickiness();
  rewireAudioEventListeners(handles);
  handles.storeSubscriptions = setupStoreSubscriptions();
  const hotkeyBindings = await loadHotkeyBindings();
  handles.hotkeys = setupHotkeys(
    {
      handlePlayPause,
      handleTimeBackward,
      handleTimeForward,
      handleTrackBackward,
      handleTrackForward,
      handleMuteToggle,
      toggleFullscreenMode,
      handleLoopCycle,
    },
    hotkeyBindings
  );
};

export const createDomObserver = (handles: CleanupHandles, reinit: () => void): MutationObserver => {
  const plumeUi = getGuiInstance();

  const observer = new MutationObserver((mutations) => {
    const plume = plumeUi.getState();

    mutations.forEach(async (mutation) => {
      if (mutation.type === "childList") {
        const bcPlayer = getBcPlayerInstance();
        const newAudio = bcPlayer.getAudioElement();

        // Check if a new audio element was added
        if (newAudio && newAudio !== plume.audioElement) {
          logger(CPL.INFO, getString("INFO__NEW_AUDIO__FOUND"));

          applyPersistedVolume(newAudio);

          // Re-setup audio event listeners: cleanup old → update store → attach new
          rewireAudioEventListeners(handles, newAudio);

          if (!isPlumeInjected()) setTimeout(reinit, 500);
        }

        // Check if the title section has changed (new track)
        if (
          mutation.target instanceof Element &&
          (mutation.target.classList.contains("title_link") || mutation.target.querySelector("a.title_link"))
        ) {
          updateTrackDisplay();
        }
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  return observer;
};

export const createSpaNavigationObserver = (
  isInitializedRef: { value: boolean },
  reinit: () => void
): MutationObserver => {
  let lastUrl = location.href;

  const observer = new MutationObserver(() => {
    const currentPageUrl = location.href;
    if (currentPageUrl === lastUrl) return;

    lastUrl = currentPageUrl;
    logger(CPL.LOG, getString("LOG__NAVIGATION_DETECTED"));

    cleanupFullscreenMode();
    cleanupVersionToast();

    isInitializedRef.value = false;
    setTimeout(() => {
      reinit();
      // slight delay to ensure track display is updated after navigation reinit
      setTimeout(updateTrackDisplay, 500);
    }, 1000);
  });

  observer.observe(document, { childList: true, subtree: true });
  return observer;
};

export const registerUnloadCleanup = (
  handles: CleanupHandles,
  domObserver: MutationObserver,
  spaNavigationObserver: MutationObserver
): void => {
  window.addEventListener("unload", () => {
    domObserver.disconnect();
    spaNavigationObserver.disconnect();

    cleanupFullscreenMode();
    cleanupVersionToast();

    if (handles.stickiness) {
      handles.stickiness();
      handles.stickiness = null;
    }

    if (handles.storeSubscriptions) {
      handles.storeSubscriptions();
      handles.storeSubscriptions = null;
    }

    if (handles.hotkeys) {
      handles.hotkeys();
      handles.hotkeys = null;
    }

    if (handles.audioEvents) {
      handles.audioEvents();
      handles.audioEvents = null;
    }
  });
};
