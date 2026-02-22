import { bandcampPlayer } from "../../infra/adapters";
import { PLUME_ELEM_SELECTORS } from "../../infra/elements/plume";
import { CPL, logger } from "../../shared/logger";
import { coreActions, getAppCoreInstance } from "../stores/AppCoreImpl";
import { getGuiInstance, guiActions } from "../stores/GuiImpl";
import { setupAudioEventListeners } from "./audio-events";
import { cleanupFullscreenMode, toggleFullscreenMode } from "./fullscreen";
import { getString } from "./i18n";
import { setupHotkeys } from "./keyboard";
import { setupStoreSubscriptions } from "./store-subscriptions";
import { getTrackQuantifiers } from "./track-quantifiers";
import { getCurrentTrackTitle } from "./track-title";
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

const isLastTrackOfAlbumPlaying = () => {
  const trackRowTitles = bandcampPlayer.getTrackRowTitles();
  if (trackRowTitles.length === 0) return false;

  const lastTrackTitle = trackRowTitles[trackRowTitles.length - 1];
  const currentTrackTitle = bandcampPlayer.getTrackTitle("album");
  if (!currentTrackTitle) return false;

  return lastTrackTitle === currentTrackTitle;
};

const updateTrackForwardBtnState = () => {
  const appCore = getAppCoreInstance();
  const trackFwdBtns: NodeListOf<HTMLButtonElement> = document.querySelectorAll(PLUME_ELEM_SELECTORS.trackFwdBtn);
  if (trackFwdBtns.length === 0) return;

  const isAlbumPage = appCore.getState().pageType === "album";
  const shouldDisable = !isAlbumPage || isLastTrackOfAlbumPlaying();
  trackFwdBtns.forEach((btn) => (btn.disabled = shouldDisable));
};

// Function to update the pretext display (track numbering)
const updatePretextDisplay = () => {
  const appCore = getAppCoreInstance();
  const plumeUi = getGuiInstance();
  const plume = plumeUi.getState();
  const preText = plume.titleDisplay?.querySelector(PLUME_ELEM_SELECTORS.headerTitlePretext) as HTMLSpanElement;
  if (!preText) return;

  const isAlbumPage = appCore.getState().pageType === "album";
  const newTrackTitle = getCurrentTrackTitle(isAlbumPage);
  const newTq = getTrackQuantifiers(newTrackTitle);
  const trackNumberText = isAlbumPage
    ? getString("LABEL__TRACK_CURRENT", [`${newTq.current}/${newTq.total}`])
    : getString("LABEL__TRACK");

  // Dispatch track number change to store for fullscreen sync
  appCore.dispatch(coreActions.setTrackNumber(trackNumberText));

  preText.textContent = trackNumberText;

  const headerCurrent = plume.titleDisplay?.querySelector(PLUME_ELEM_SELECTORS.headerCurrent) as HTMLDivElement;
  headerCurrent.ariaLabel = isAlbumPage
    ? getString("ARIA__TRACK_CURRENT", [newTq.current, newTq.total, newTrackTitle])
    : getString("ARIA__TRACK", [newTrackTitle]);
};

const LOGO_DEFAULT_VERTICAL_PADDING = 1; // in rem, from `styles.css`
// Expected single-line height for Latin characters in px. Used as baseline to calculate additional padding needed when title wraps to multiple lines or uses taller character sets.
const LATIN_CHAR_HEIGHT = 19;
// Function to update the title display when track changes
const updateTitleDisplay = () => {
  const appCore = getAppCoreInstance();
  const plumeUi = getGuiInstance();
  const plume = plumeUi.getState();

  const titleText = plume.titleDisplay?.querySelector(PLUME_ELEM_SELECTORS.headerTitle) as HTMLSpanElement;
  if (!titleText) return;

  const isAlbumPage = appCore.getState().pageType === "album";
  const newTrackTitle = getCurrentTrackTitle(isAlbumPage);
  titleText.textContent = newTrackTitle;
  titleText.title = newTrackTitle; // allow the user to see the full title on hover, in case the title is truncated

  // Dispatch title change to store for fullscreen sync
  appCore.dispatch(coreActions.setTrackTitle(newTrackTitle));

  // Cache offsetHeight to avoid multiple layout recalculations
  const titleHeight = titleText.offsetHeight;
  if (titleHeight !== LATIN_CHAR_HEIGHT) {
    const logo = document.querySelector(PLUME_ELEM_SELECTORS.headerLogo) as HTMLAnchorElement;
    if (!logo) return;

    const deltaPaddingPx = titleHeight - LATIN_CHAR_HEIGHT; // calculate difference in px
    const deltaPaddingRem = deltaPaddingPx / 16; // 16px = 1rem
    logo.style.paddingTop = `${LOGO_DEFAULT_VERTICAL_PADDING + deltaPaddingRem}rem`;
  }
};

// Holds all active cleanup callbacks so observers and the unload handler can reach them
export interface CleanupHandles {
  audioEvents: CleanupCallback | null;
  storeSubscriptions: CleanupCallback | null;
  hotkeys: CleanupCallback | null;
  stickiness: CleanupCallback | null;
}

// Wires audio event listeners and updates the handles object in-place
const rewireAudioEventListeners = (handles: CleanupHandles): void => {
  handles.audioEvents?.();
  handles.audioEvents = setupAudioEventListeners({
    updateTitleDisplay,
    updatePretextDisplay,
    updateTrackForwardBtnState,
  });
};

const applyPersistedVolume = (audio: HTMLAudioElement): void => {
  const appCore = getAppCoreInstance();
  const volume = appCore.getState().volume;
  audio.volume = volume;
  logger(CPL.INFO, getString("INFO__VOLUME__APPLIED", [Math.round(volume * 100), getString("META__PERCENTAGE")]));
};

// Registers all post-injection listeners and stores their teardown callbacks
export const setupListeners = (handles: CleanupHandles): void => {
  handles.stickiness = setupPlayerStickiness();
  rewireAudioEventListeners(handles);
  handles.storeSubscriptions = setupStoreSubscriptions();
  handles.hotkeys = setupHotkeys({
    handlePlayPause,
    handleTimeBackward,
    handleTimeForward,
    handleTrackBackward,
    handleTrackForward,
    handleMuteToggle,
    toggleFullscreenMode,
  });
};

export const createDomObserver = (handles: CleanupHandles, reinit: () => void): MutationObserver => {
  const plumeUi = getGuiInstance();

  const observer = new MutationObserver((mutations) => {
    const plume = plumeUi.getState();

    mutations.forEach(async (mutation) => {
      if (mutation.type === "childList") {
        // Check if a new audio element was added
        const newAudio = bandcampPlayer.getAudioElement();
        if (newAudio && newAudio !== plume.audioElement) {
          logger(CPL.INFO, getString("INFO__NEW_AUDIO__FOUND"));

          applyPersistedVolume(newAudio);
          plumeUi.dispatch(guiActions.setAudioElement(newAudio));

          // Re-setup audio event listeners for the new audio element
          rewireAudioEventListeners(handles);

          if (!document.querySelector(PLUME_ELEM_SELECTORS.plumeContainer)) {
            setTimeout(reinit, 500);
          }
        }

        // Check if the title section has changed (new track)
        if (
          mutation.target instanceof Element &&
          (mutation.target.classList.contains("title_link") || mutation.target.querySelector("a.title_link"))
        ) {
          updateTitleDisplay();
          updatePretextDisplay();
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

    isInitializedRef.value = false;
    setTimeout(() => {
      reinit();
      setTimeout(updateTitleDisplay, 500);
      setTimeout(updatePretextDisplay, 600); // slight delay to ensure track display is updated
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
