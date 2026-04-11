import { setupAudioEventListeners } from "@/app/features/audio-events";
import { cleanupFullscreenMode, toggleFullscreenMode } from "@/app/features/fullscreen";
import { setupHotkeys } from "@/app/features/keyboard";
import { setupStoreSubscriptions } from "@/app/features/store-subscriptions";
import { cleanupReleaseToast } from "@/app/features/toast";
import { CleanupCallback } from "@/app/features/types";
import {
  handleMuteToggle,
  handlePlayPause,
  handleTimeBackward,
  handleTimeForward,
  handleTrackBackward,
  handleTrackForward,
  setupPlayerStickiness,
} from "@/app/features/ui";
import { handleLoopCycle } from "@/app/features/ui/loop";
import { getBcPlayerInstance } from "@/app/stores/adapters";
import { getAppCoreInstance } from "@/app/stores/AppCoreImpl";
import { getGuiInstance } from "@/app/stores/GuiImpl";
import { isLastTrackOfAlbumPlaying } from "@/app/use-cases/navigate-track";
import { updateTrackMetadata } from "@/app/use-cases/update-track-metadata";
import { LOOP_MODE, PLUME_CONSTANTS } from "@/domain/plume";
import { guiActions } from "@/domain/ports/plume-ui";
import { BC_ELEM_SELECTORS } from "@/infra/elements/bandcamp";
import { PLUME_ELEM_SELECTORS } from "@/infra/elements/plume";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

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

  if (preText) {
    preText.textContent = trackNumberText;

    const headerCurrent = plume.titleDisplay?.querySelector(PLUME_ELEM_SELECTORS.headerCurrent) as HTMLDivElement;
    if (headerCurrent) {
      headerCurrent.ariaLabel = isAlbumPage
        ? getString("ARIA__TRACK_CURRENT", [String(current), String(total), newTrackTitle])
        : getString("ARIA__TRACK", [newTrackTitle]);
    }
  }

  if (titleText) {
    if (isAlbumPage) {
      const trackLink = plume.titleDisplay?.querySelector(PLUME_ELEM_SELECTORS.headerTrackLink) as HTMLAnchorElement;
      if (trackLink) {
        const trackUrl = bcPlayer.getCurrentTrackUrl();

        if (trackUrl) {
          trackLink.href = trackUrl;
          trackLink.ariaDisabled = "false";
          trackLink.style.pointerEvents = "";
          trackLink.tabIndex = 0;
        } else {
          trackLink.removeAttribute("href");
          trackLink.ariaDisabled = "true";
          trackLink.style.pointerEvents = "none";
          trackLink.tabIndex = -1;
        }
      }
    } else {
      logger(CPL.WARN, getString("WARN__TRACK_LINK__NOT_FOUND"));
    }
    titleText.textContent = newTrackTitle;
    titleText.title = newTrackTitle; // allow the user to see the full title on hover, in case the title is truncated
  }
};

// Holds all active cleanup callbacks so observers and the unload handler can reach them
export interface CleanupHandles {
  audioEvents: CleanupCallback | null;
  storeSubscriptions: CleanupCallback | null;
  stickiness: CleanupCallback | null;
  tracklist: CleanupCallback | null;
  hotkeys: CleanupCallback | null;
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
export const setupListeners = (handles: CleanupHandles) => {
  handles.stickiness = setupPlayerStickiness();
  rewireAudioEventListeners(handles);
  handles.storeSubscriptions = setupStoreSubscriptions();
  const hotkeyBindings = getAppCoreInstance().getState().hotkeyBindings;
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

          if (!isPlumeInjected()) setTimeout(reinit, PLUME_CONSTANTS.TRACK_DISPLAY_UPDATE_DELAY_MS);
        }

        const titleLinkSelector = BC_ELEM_SELECTORS.albumPageCurrentTrackTitle;
        // Check if the title section has changed (new track)
        if (
          mutation.target instanceof Element &&
          (mutation.target.classList.contains(titleLinkSelector.split(".")[1]) ||
            mutation.target.querySelector(titleLinkSelector))
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
    cleanupReleaseToast();

    isInitializedRef.value = false;
    setTimeout(() => {
      reinit();
      // slight delay to ensure track display is updated after navigation reinit
      setTimeout(updateTrackDisplay, PLUME_CONSTANTS.TRACK_DISPLAY_UPDATE_DELAY_MS);
    }, PLUME_CONSTANTS.SPA_REINIT_DELAY_MS);
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
    cleanupReleaseToast();

    if (handles.audioEvents) {
      handles.audioEvents();
      handles.audioEvents = null;
    }

    if (handles.storeSubscriptions) {
      handles.storeSubscriptions();
      handles.storeSubscriptions = null;
    }

    if (handles.stickiness) {
      handles.stickiness();
      handles.stickiness = null;
    }

    if (handles.tracklist) {
      handles.tracklist();
      handles.tracklist = null;
    }

    if (handles.hotkeys) {
      handles.hotkeys();
      handles.hotkeys = null;
    }
  });
};
