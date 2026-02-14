// Plume - TypeScript for song page and album page display
import { BC_ELEM_IDENTIFIERS, DebugControl } from "./domain/bandcamp";
import { APP_NAME, APP_VERSION, PLUME_KO_FI_URL } from "./domain/meta";
import { PLUME_ELEM_IDENTIFIERS } from "./domain/plume";
import { setupAudioEventListeners } from "./features/audio-events";
import { cleanupFullscreenMode, toggleFullscreenMode } from "./features/fullscreen";
import { getString, logDetectedBrowser } from "./features/i18n";
import { setupHotkeys } from "./features/keyboard";
import { CPL, logger } from "./features/logger";
import {
  findOriginalPlayerContainer,
  hideOriginalPlayerElements,
  restoreOriginalPlayerElements,
} from "./features/original-player";
import { getInfoSectionWithRuntime } from "./features/runtime";
import { setupStoreSubscriptions } from "./features/store-subscriptions";
import { getTrackQuantifiers } from "./features/track-quantifiers";
import { getAppropriatePretextColor, getCurrentTrackTitle } from "./features/track-title";
import {
  createFullscreenButtonSection,
  createPlaybackControlPanel,
  createProgressBar,
  createVolumeControlSection,
  handlePlayPause,
  handleTimeBackward,
  handleTimeForward,
  handleTrackBackward,
  handleTrackForward,
  setupPlayerStickiness,
} from "./features/ui";
import { getPlumeUiInstance, PLUME_ACTION_TYPES } from "./infra/AppInstanceImpl";
import { getStoreInstance, STORE_ACTION_TYPES } from "./infra/AppStoreImpl";
import { PLUME_SVG } from "./svg/icons";

(() => {
  "use strict";

  logDetectedBrowser();
  const store = getStoreInstance();
  const plumeUiInstance = getPlumeUiInstance();

  // Function to initialize playback (necessary to make Plume buttons effective)
  const initPlayback = () => {
    const playButton = document.querySelector(BC_ELEM_IDENTIFIERS.playPause) as HTMLButtonElement;
    if (playButton) {
      // Double-click to ensure playback has started
      playButton.click();
      playButton.click();
    } else {
      logger(CPL.WARN, getString("WARN__PLAY_PAUSE__NOT_FOUND"));
    }
  };

  // Function to find the audio element
  const findAudioElement = async (): Promise<HTMLAudioElement | null> => {
    const audio = document.querySelector(BC_ELEM_IDENTIFIERS.audioPlayer) as HTMLAudioElement;
    if (!audio) return null;
    logger(CPL.INFO, getString("INFO__AUDIO__FOUND"), audio);

    // Load and immediately apply saved volume from store
    const volume = store.getState().volume;
    audio.volume = volume;
    logger(CPL.INFO, `${getString("INFO__VOLUME__FOUND")} ${Math.round(volume * 100)}${getString("META__PERCENTAGE")}`);

    return audio;
  };

  const addRuntime = () => {
    const trackView = document.querySelector(BC_ELEM_IDENTIFIERS.trackView) as HTMLDivElement;
    trackView.insertBefore(getInfoSectionWithRuntime(), trackView.firstChild);
  };

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
    const trackList = document.querySelector(BC_ELEM_IDENTIFIERS.trackList) as HTMLTableElement;
    if (!trackList) return false;

    const trackRows = trackList.querySelectorAll(BC_ELEM_IDENTIFIERS.trackRow);
    const lastTrackRow = trackRows[trackRows.length - 1] as HTMLTableRowElement;
    const lastTrackTitleElem = lastTrackRow?.querySelector(BC_ELEM_IDENTIFIERS.trackTitle) as HTMLSpanElement;
    const currentTrackTitleElem = document.querySelector(
      BC_ELEM_IDENTIFIERS.albumPageCurrentTrackTitle
    ) as HTMLAnchorElement;
    if (!currentTrackTitleElem) return false;

    return lastTrackTitleElem?.textContent === currentTrackTitleElem.textContent;
  };

  const injectEnhancements = async () => {
    const bcPlayerContainer = findOriginalPlayerContainer();
    if (!bcPlayerContainer) {
      logger(CPL.ERROR, getString("ERROR__UNABLE_TO_FIND_CONTAINER"));
      return;
    }

    const isAlbumPage = store.getState().pageType === "album";

    restoreOriginalPlayerElements(); // call it to prevent "unused function" linter warning
    hideOriginalPlayerElements();

    const plumeContainer = document.createElement("div");
    plumeContainer.id = PLUME_ELEM_IDENTIFIERS.plumeContainer.split("#")[1];

    const headerContainer = document.createElement("div");
    headerContainer.id = PLUME_ELEM_IDENTIFIERS.headerContainer.split("#")[1];

    const headerLogo = document.createElement("a");
    headerLogo.id = PLUME_ELEM_IDENTIFIERS.headerLogo.split("#")[1];
    headerLogo.innerHTML = PLUME_SVG.logo + `<p id="${headerLogo.id}__version">${APP_VERSION}</p>`;
    headerLogo.href = PLUME_KO_FI_URL;
    headerLogo.target = "_blank";
    headerLogo.rel = "noopener noreferrer";
    headerLogo.ariaLabel = APP_NAME;
    headerLogo.title = getString("ARIA__LOGO_LINK");
    headerContainer.appendChild(headerLogo);

    const initialTrackTitle = getCurrentTrackTitle(isAlbumPage);
    const initialTq = getTrackQuantifiers(initialTrackTitle);
    const currentTitleSection = document.createElement("div");
    currentTitleSection.id = PLUME_ELEM_IDENTIFIERS.headerCurrent.split("#")[1];
    currentTitleSection.tabIndex = 0; // make it focusable for screen readers
    currentTitleSection.ariaLabel = isAlbumPage
      ? getString("ARIA__TRACK_CURRENT", [initialTq.current, initialTq.total, initialTrackTitle])
      : getString("ARIA__TRACK", initialTrackTitle);
    const currentTitlePretext = document.createElement("span");
    currentTitlePretext.id = PLUME_ELEM_IDENTIFIERS.headerTitlePretext.split("#")[1];
    const initialTrackNumberText = isAlbumPage
      ? getString("LABEL__TRACK_CURRENT", `${initialTq.current}/${initialTq.total}`)
      : getString("LABEL__TRACK");
    currentTitlePretext.textContent = initialTrackNumberText;
    currentTitlePretext.style.color = getAppropriatePretextColor();
    currentTitlePretext.ariaHidden = "true"; // hide from screen readers to avoid redundancy
    currentTitleSection.appendChild(currentTitlePretext);
    const currentTitleText = document.createElement("span");
    currentTitleText.id = PLUME_ELEM_IDENTIFIERS.headerTitle.split("#")[1];
    currentTitleText.textContent = initialTrackTitle;
    currentTitleText.title = initialTrackTitle; // see full title on hover in case title is truncated
    currentTitleText.ariaHidden = "true"; // hide from screen readers to avoid redundancy
    currentTitleSection.appendChild(currentTitleText);
    headerContainer.appendChild(currentTitleSection);

    // Initialize store with current track title and track number
    store.dispatch({ type: STORE_ACTION_TYPES.SET_TRACK_TITLE, payload: initialTrackTitle });
    store.dispatch({ type: STORE_ACTION_TYPES.SET_TRACK_NUMBER, payload: initialTrackNumberText });

    plumeUiInstance.dispatch({ type: PLUME_ACTION_TYPES.SET_TITLE_DISPLAY, payload: headerContainer });
    plumeContainer.appendChild(headerContainer);

    const playbackManager = document.createElement("div");
    playbackManager.id = PLUME_ELEM_IDENTIFIERS.playbackManager.split("#")[1];

    const progressContainer = createProgressBar();
    playbackManager.appendChild(progressContainer);
    const playbackControls = createPlaybackControlPanel();
    if (playbackControls) {
      playbackManager.appendChild(playbackControls);
    }
    plumeContainer.appendChild(playbackManager);

    const volumeContainer = await createVolumeControlSection();
    if (volumeContainer) {
      plumeContainer.appendChild(volumeContainer);
    }

    const fullscreenBtnSection = createFullscreenButtonSection(toggleFullscreenMode);
    plumeContainer.appendChild(fullscreenBtnSection);

    bcPlayerContainer.appendChild(plumeContainer);

    logger(CPL.LOG, getString("LOG__MOUNT__COMPLETE"));

    if (isAlbumPage) addRuntime();
  };

  const updateTrackForwardBtnState = () => {
    const trackFwdBtns: NodeListOf<HTMLButtonElement> = document.querySelectorAll(PLUME_ELEM_IDENTIFIERS.trackFwdBtn);
    if (trackFwdBtns.length === 0) return;

    const isAlbumPage = store.getState().pageType === "album";
    const shouldDisable = !isAlbumPage || isLastTrackOfAlbumPlaying();
    trackFwdBtns.forEach((btn) => (btn.disabled = shouldDisable));
  };

  // Function to update the pretext display (track numbering)
  const updatePretextDisplay = () => {
    const plume = plumeUiInstance.getState();
    const preText = plume.titleDisplay?.querySelector(PLUME_ELEM_IDENTIFIERS.headerTitlePretext) as HTMLSpanElement;
    if (!preText) return;

    const isAlbumPage = store.getState().pageType === "album";
    const newTrackTitle = getCurrentTrackTitle(isAlbumPage);
    const newTq = getTrackQuantifiers(newTrackTitle);
    const trackNumberText = isAlbumPage
      ? getString("LABEL__TRACK_CURRENT", `${newTq.current}/${newTq.total}`)
      : getString("LABEL__TRACK");

    // Dispatch track number change to store for fullscreen sync
    store.dispatch({ type: STORE_ACTION_TYPES.SET_TRACK_NUMBER, payload: trackNumberText });

    preText.textContent = trackNumberText;

    const headerCurrent = plume.titleDisplay?.querySelector(PLUME_ELEM_IDENTIFIERS.headerCurrent) as HTMLDivElement;
    headerCurrent.ariaLabel = isAlbumPage
      ? getString("ARIA__TRACK_CURRENT", [newTq.current, newTq.total, newTrackTitle])
      : getString("ARIA__TRACK", newTrackTitle);
  };

  const LOGO_DEFAULT_VERTICAL_PADDING = 1; // in rem, from `styles.css`
  // Expected single-line height for Latin characters in px. Used as baseline to calculate additional padding needed when title wraps to multiple lines or uses taller character sets.
  const LATIN_CHAR_HEIGHT = 19;
  // Function to update the title display when track changes
  const updateTitleDisplay = () => {
    const plume = plumeUiInstance.getState();
    const titleText = plume.titleDisplay?.querySelector(PLUME_ELEM_IDENTIFIERS.headerTitle) as HTMLSpanElement;
    if (!titleText) return;

    const isAlbumPage = store.getState().pageType === "album";
    const newTrackTitle = getCurrentTrackTitle(isAlbumPage);
    titleText.textContent = newTrackTitle;
    titleText.title = newTrackTitle; // allow the user to see the full title on hover, in case the title is truncated

    // Dispatch title change to store for fullscreen sync
    store.dispatch({ type: STORE_ACTION_TYPES.SET_TRACK_TITLE, payload: newTrackTitle });

    // Cache offsetHeight to avoid multiple layout recalculations
    const titleHeight = titleText.offsetHeight;
    if (titleHeight !== LATIN_CHAR_HEIGHT) {
      const logo = document.querySelector(PLUME_ELEM_IDENTIFIERS.headerLogo) as HTMLAnchorElement;
      if (!logo) return;

      const deltaPaddingPx = titleHeight - LATIN_CHAR_HEIGHT; // calculate difference in px
      const deltaPaddingRem = deltaPaddingPx / 16; // 16px = 1rem
      logo.style.paddingTop = `${LOGO_DEFAULT_VERTICAL_PADDING + deltaPaddingRem}rem`;
    }
  };

  // Main initialization function
  let isInitializing = false;
  let isInitialized = false;
  let storeCleanupCallback: (() => void) | null = null;
  let keyboardCleanupCallback: (() => void) | null = null;
  let stickinessCleanupCallback: (() => void) | null = null;
  let audioEventsCleanupCallback: (() => void) | null = null;

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

    // Load persisted state into store
    store.loadPersistedState();

    const isAlbumPage = globalThis.location.pathname.includes("/album/");
    store.dispatch({ type: STORE_ACTION_TYPES.SET_PAGE_TYPE, payload: isAlbumPage ? "album" : "track" });

    const audioElement = await findAudioElement();
    if (!audioElement) {
      logger(CPL.WARN, getString("WARN__AUDIO_ELEMENT__NOT_FOUND"));
      isInitializing = false;
      setTimeout(init, 1000); // retry after 1 second
      return;
    }
    plumeUiInstance.dispatch({ type: PLUME_ACTION_TYPES.SET_AUDIO_ELEMENT, payload: audioElement });

    const plumeIsAlreadyInjected = !!document.querySelector(PLUME_ELEM_IDENTIFIERS.plumeContainer);
    if (plumeIsAlreadyInjected) {
      isInitializing = false;
      isInitialized = true;
      return;
    }

    // Duration display method is already loaded from persisted state
    const durationDisplayMethod = store.getState().durationDisplayMethod;
    logger(CPL.INFO, `${getString("INFO__TIME_DISPLAY_METHOD__APPLIED")} "${durationDisplayMethod}"`);

    // Inject enhancements
    await injectEnhancements();
    audioEventsCleanupCallback = setupAudioEventListeners({
      updateTitleDisplay,
      updatePretextDisplay,
      updateTrackForwardBtnState,
    });
    storeCleanupCallback = setupStoreSubscriptions();
    keyboardCleanupCallback = setupHotkeys({
      handlePlayPause,
      handleTimeBackward,
      handleTimeForward,
      handleTrackBackward,
      handleTrackForward,
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
    const plume = plumeUiInstance.getState();

    mutations.forEach(async (mutation) => {
      if (mutation.type === "childList") {
        // Check if a new audio element was added
        const newAudio = document.querySelector(BC_ELEM_IDENTIFIERS.audioPlayer) as HTMLAudioElement;
        if (newAudio && newAudio !== plume.audioElement) {
          logger(CPL.INFO, getString("INFO__NEW_AUDIO__FOUND"));

          // Load and apply saved volume to the new element
          const volume = store.getState().volume;
          newAudio.volume = volume;
          logger(
            CPL.INFO,
            `${getString("INFO__VOLUME__APPLIED")} ${Math.round(volume * 100)}${getString("META__PERCENTAGE")}`
          );

          plumeUiInstance.dispatch({ type: PLUME_ACTION_TYPES.SET_AUDIO_ELEMENT, payload: newAudio });

          // Reset if needed
          if (!document.querySelector(PLUME_ELEM_IDENTIFIERS.plumeContainer)) {
            setTimeout(init, 500);
          }
        }

        // Check if the title section has changed (new track)
        if (
          mutation.target instanceof Element &&
          (mutation.target.classList.contains(BC_ELEM_IDENTIFIERS.albumPageCurrentTrackTitle.slice(1)) ||
            mutation.target.querySelector(BC_ELEM_IDENTIFIERS.albumPageCurrentTrackTitle))
        ) {
          updateTitleDisplay();
          updatePretextDisplay();
        }
      }
    });
  });
  domObserver.observe(document.body, { childList: true, subtree: true });

  init();
  stickinessCleanupCallback = setupPlayerStickiness();

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
    if (keyboardCleanupCallback) {
      keyboardCleanupCallback();
      keyboardCleanupCallback = null;
    }

    // Cleanup audio event listeners
    if (audioEventsCleanupCallback) {
      audioEventsCleanupCallback();
      audioEventsCleanupCallback = null;
    }
  });
})();
