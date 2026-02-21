import { BC_ELEM_SELECTORS } from "../../infra/elements/bandcamp";
import { PLUME_ELEM_SELECTORS } from "../../infra/elements/plume";
import { CPL, logger } from "../../shared/logger";
import { coreActions, getAppCoreInstance } from "../stores/AppCoreImpl";
import { getGuiInstance, guiActions } from "../stores/GuiImpl";
import { checkBandcampElements } from "./bc-health-check";
import { debugBandcampControls } from "./debug";
import { getString } from "./i18n";
import { injectEnhancements } from "./injection";
import {
  CleanupHandles,
  createDomObserver,
  createSpaNavigationObserver,
  registerUnloadCleanup,
  setupListeners,
} from "./observers";

const initPlayback = () => {
  const playButton = document.querySelector(BC_ELEM_SELECTORS.playPause) as HTMLButtonElement;
  if (playButton) {
    playButton.click();
  } else {
    logger(CPL.WARN, getString("WARN__PLAY_PAUSE__NOT_FOUND"));
  }
};

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

/**
 * Initializes the Plume player enhancement
 * Sets up all observers, event listeners, and manages the application lifecycle
 */
export const launchPlume = (): void => {
  const appCore = getAppCoreInstance();
  const plumeUi = getGuiInstance();

  const handles: CleanupHandles = {
    audioEvents: null,
    storeSubscriptions: null,
    hotkeys: null,
    stickiness: null,
  };

  const isInitializedRef = { value: false };
  let isInitializing = false;

  const init = async () => {
    // Prevent concurrent initialization
    if (isInitializing || isInitializedRef.value) return;
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
      isInitializedRef.value = true;
      return;
    }

    // Duration display method is already loaded from persisted state
    const durationDisplayMethod = appCore.getState().durationDisplayMethod;
    logger(CPL.INFO, getString("INFO__TIME_DISPLAY_METHOD__APPLIED", [durationDisplayMethod]));

    await injectEnhancements();
    setupListeners(handles);
    initPlayback();

    // Debug: show detected controls
    debugBandcampControls();

    logger(CPL.LOG, getString("LOG__INITIALIZATION__COMPLETE"));
    isInitializing = false;
    isInitializedRef.value = true;
  };

  const domObserver = createDomObserver(handles, init);
  const spaNavigationObserver = createSpaNavigationObserver(isInitializedRef, init);

  registerUnloadCleanup(handles, domObserver, spaNavigationObserver);

  init();
};
