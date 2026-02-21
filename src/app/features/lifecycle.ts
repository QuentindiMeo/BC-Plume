import { BC_ELEM_SELECTORS } from "../../infra/elements/bandcamp";
import { PLUME_ELEM_SELECTORS } from "../../infra/elements/plume";
import { CPL, logger } from "../../shared/logger";
import { coreActions, getAppCoreInstance } from "../stores/AppCoreImpl";
import { getGuiInstance, guiActions } from "../stores/GuiImpl";
import { setupAudioEventListeners } from "./audio-events";
import { checkBandcampElements } from "./bc-health-check";
import { cleanupFullscreenMode, toggleFullscreenMode } from "./fullscreen";
import { getString } from "./i18n";
import { injectEnhancements } from "./injection";
import { setupHotkeys } from "./keyboard";
import { setupStoreSubscriptions } from "./store-subscriptions";
import { getTrackQuantifiers } from "./track-quantifiers";
import { getCurrentTrackTitle } from "./track-title";
import {
  handleMuteToggle,
  handlePlayPause,
  handleTimeBackward,
  handleTimeForward,
  handleTrackBackward,
  handleTrackForward,
  setupPlayerStickiness,
} from "./ui";

// Function to initialize playback
const initPlayback = () => {
  const playButton = document.querySelector(BC_ELEM_SELECTORS.playPause) as HTMLButtonElement;
  if (playButton) {
    playButton.click();
  } else {
    logger(CPL.WARN, getString("WARN__PLAY_PAUSE__NOT_FOUND"));
  }
};

// Function to find the audio element
const findAudioElement = async (): Promise<HTMLAudioElement | null> => {
  const appCore = getAppCoreInstance();
  const audio = document.querySelector(BC_ELEM_SELECTORS.audioPlayer) as HTMLAudioElement;
  if (!audio) return null;
  logger(CPL.INFO, getString("INFO__AUDIO__FOUND"), audio);

  // Load and immediately apply saved volume from store
  const volume = appCore.getState().volume;
  audio.volume = volume;
  logger(CPL.INFO, getString("INFO__VOLUME__FOUND", [Math.round(volume * 100), getString("META__PERCENTAGE")]));

  return audio;
};

interface DebugControl {
  index: number;
  tagName: string;
  classes: string;
  title: string;
  text: string;
  onclick: string;
}
// Debug function to identify Bandcamp controls
const debugBandcampControls = (): Array<DebugControl> => {
  logger(CPL.DEBUG, getString("DEBUG__CONTROL_ELEMENTS__DETECTED"));

  // Find all possible buttons and links
  const buttonIdentifiers = 'button, a, div[role="button"], span[onclick]';
  const allButtons = document.querySelectorAll(buttonIdentifiers) as unknown as Array<HTMLButtonElement>;
  const relevantControls: Array<DebugControl> = [];

  allButtons.forEach((element, index) => {
    const classes = element.className || "";
    const title = element.title || "";
    const text = element.textContent || "";
    const onclick = element.onclick || "";

    // Filter elements that could be controls
    if (
      classes.includes("play") ||
      classes.includes("pause") ||
      classes.includes("next") ||
      classes.includes("prev") ||
      classes.includes("skip") ||
      classes.includes("control") ||
      title.toLowerCase().includes("play") ||
      title.toLowerCase().includes("next") ||
      title.toLowerCase().includes("prev") ||
      title.toLowerCase().includes("skip")
    ) {
      relevantControls.push({
        index,
        tagName: element.tagName,
        classes,
        title,
        text: text.trim().substring(0, 20),
        onclick: onclick.toString().substring(0, 50),
      });
    }
  });

  logger(CPL.DEBUG, getString("DEBUG__CONTROL_ELEMENTS__FOUND"), relevantControls);
  logger(CPL.DEBUG, getString("DEBUG__CONTROL_ELEMENTS__END"));

  return relevantControls;
};

const isLastTrackOfAlbumPlaying = () => {
  const trackList = document.querySelector(BC_ELEM_SELECTORS.trackList) as HTMLTableElement;
  if (!trackList) return false;

  const trackRows = trackList.querySelectorAll(BC_ELEM_SELECTORS.trackRow);
  const lastTrackRow = trackRows[trackRows.length - 1] as HTMLTableRowElement;
  const lastTrackTitleElem = lastTrackRow?.querySelector(BC_ELEM_SELECTORS.trackTitle) as HTMLSpanElement;
  const currentTrackTitleElem = document.querySelector(
    BC_ELEM_SELECTORS.albumPageCurrentTrackTitle
  ) as HTMLAnchorElement;
  if (!currentTrackTitleElem) return false;

  return lastTrackTitleElem?.textContent === currentTrackTitleElem.textContent;
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

/**
 * Initializes the Plume player enhancement
 * Sets up all observers, event listeners, and manages the application lifecycle
 */
export const launchPlume = (): void => {
  const appCore = getAppCoreInstance();
  const plumeUi = getGuiInstance();

  // Main initialization state
  let isInitializing = false;
  let isInitialized = false;
  let audioEventsCleanupCallback: (() => void) | null = null;
  let storeCleanupCallback: (() => void) | null = null;
  let kbCleanupCallback: (() => void) | null = null;
  let stickinessCleanupCallback: (() => void) | null = null;

  const init = async () => {
    // Prevent concurrent initialization
    if (isInitializing || isInitialized) return;
    isInitializing = true;

    logger(CPL.INFO, getString("LOG__INITIALIZATION__START"));

    // Wait for the page to be fully loaded
    if (document.readyState !== "complete") {
      isInitializing = false;
      window.addEventListener("load", init, { once: true });
      return;
    }

    checkBandcampElements();

    // Load persisted state into store
    await appCore.loadPersistedState();

    const isAlbumPage = globalThis.location.pathname.includes("/album/");
    appCore.dispatch(coreActions.setPageType(isAlbumPage ? "album" : "track"));

    const audioElement = await findAudioElement();
    if (!audioElement) {
      logger(CPL.WARN, getString("WARN__AUDIO_ELEMENT__NOT_FOUND"));
      isInitializing = false;
      setTimeout(init, 1000); // retry after 1 second
      return;
    }
    plumeUi.dispatch(guiActions.setAudioElement(audioElement));

    const plumeIsAlreadyInjected = !!document.querySelector(PLUME_ELEM_SELECTORS.plumeContainer);
    if (plumeIsAlreadyInjected) {
      isInitializing = false;
      isInitialized = true;
      return;
    }

    // Duration display method is already loaded from persisted state
    const durationDisplayMethod = appCore.getState().durationDisplayMethod;
    logger(CPL.INFO, getString("INFO__TIME_DISPLAY_METHOD__APPLIED", [durationDisplayMethod]));

    // Inject enhancements
    await injectEnhancements();
    stickinessCleanupCallback = setupPlayerStickiness();
    audioEventsCleanupCallback = setupAudioEventListeners({
      updateTitleDisplay,
      updatePretextDisplay,
      updateTrackForwardBtnState,
    });
    storeCleanupCallback = setupStoreSubscriptions();
    kbCleanupCallback = setupHotkeys({
      handlePlayPause,
      handleTimeBackward,
      handleTimeForward,
      handleTrackBackward,
      handleTrackForward,
      handleMuteToggle,
      toggleFullscreenMode,
    });
    initPlayback();

    // Debug: show detected controls
    debugBandcampControls();

    logger(CPL.LOG, getString("LOG__INITIALIZATION__COMPLETE"));
    isInitializing = false;
    isInitialized = true;
  };

  // Observe DOM changes for players that load dynamically
  const domObserver = new MutationObserver((mutations) => {
    const plume = plumeUi.getState();

    mutations.forEach(async (mutation) => {
      if (mutation.type === "childList") {
        // Check if a new audio element was added
        const newAudio = document.querySelector(BC_ELEM_SELECTORS.audioPlayer) as HTMLAudioElement;
        if (newAudio && newAudio !== plume.audioElement) {
          logger(CPL.INFO, getString("INFO__NEW_AUDIO__FOUND"));

          // Load and apply saved volume to the new element
          const volume = appCore.getState().volume;
          newAudio.volume = volume;
          logger(
            CPL.INFO,
            getString("INFO__VOLUME__APPLIED", [Math.round(volume * 100), getString("META__PERCENTAGE")])
          );

          plumeUi.dispatch(guiActions.setAudioElement(newAudio));

          // Re-setup audio event listeners for the new audio element
          audioEventsCleanupCallback?.();
          audioEventsCleanupCallback = setupAudioEventListeners({
            updateTitleDisplay,
            updatePretextDisplay,
            updateTrackForwardBtnState,
          });

          // Reset if needed
          if (!document.querySelector(PLUME_ELEM_SELECTORS.plumeContainer)) {
            setTimeout(init, 500);
          }
        }

        // Check if the title section has changed (new track)
        if (
          mutation.target instanceof Element &&
          (mutation.target.classList.contains(BC_ELEM_SELECTORS.albumPageCurrentTrackTitle.slice(1)) ||
            mutation.target.querySelector(BC_ELEM_SELECTORS.albumPageCurrentTrackTitle))
        ) {
          updateTitleDisplay();
          updatePretextDisplay();
        }
      }
    });
  });
  domObserver.observe(document.body, { childList: true, subtree: true });

  init();

  // Support for SPA navigation
  let lastUrl = location.href;
  const spaNavigationObserver = new MutationObserver(() => {
    const currentPageUrl = location.href;
    if (currentPageUrl === lastUrl) return;

    lastUrl = currentPageUrl;
    logger(CPL.LOG, getString("LOG__NAVIGATION_DETECTED"));

    // Clean up fullscreen if active before navigation
    cleanupFullscreenMode();

    // Reset initialization flag to allow re-initialization on navigation
    isInitialized = false;
    setTimeout(() => {
      init();
      setTimeout(updateTitleDisplay, 500);
      setTimeout(updatePretextDisplay, 600); // slight delay to ensure track display is updated
    }, 1000);
  });
  spaNavigationObserver.observe(document, { subtree: true, childList: true });

  // Cleanup observers on page unload
  window.addEventListener("unload", () => {
    domObserver.disconnect();
    spaNavigationObserver.disconnect();

    // Cleanup fullscreen subscriptions if active
    cleanupFullscreenMode();

    // Cleanup player stickiness
    if (stickinessCleanupCallback) {
      stickinessCleanupCallback();
      stickinessCleanupCallback = null;
    }

    // Cleanup main UI store subscriptions
    if (storeCleanupCallback) {
      storeCleanupCallback();
      storeCleanupCallback = null;
    }

    // Cleanup keyboard hotkeys
    if (kbCleanupCallback) {
      kbCleanupCallback();
      kbCleanupCallback = null;
    }

    // Cleanup audio event listeners
    if (audioEventsCleanupCallback) {
      audioEventsCleanupCallback();
      audioEventsCleanupCallback = null;
    }
  });
};
