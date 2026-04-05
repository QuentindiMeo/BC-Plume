import { checkBandcampElements } from "@/app/features/bc-diagnostic";
import { debugBandcampControls } from "@/app/features/debug";
import { injectEnhancements } from "@/app/features/injection";
import {
  CleanupHandles,
  createDomObserver,
  createSpaNavigationObserver,
  isPlumeInjected,
  registerUnloadCleanup,
  setupListeners,
} from "@/app/features/observers";
import { showReleaseToast } from "@/app/features/toast";
import { createToast, ToastHandle } from "@/app/features/ui/toast";
import { getBcPlayerInstance } from "@/app/stores/adapters";
import { getAppCoreInstance } from "@/app/stores/AppCoreImpl";
import { getBrowserInstance } from "@/app/stores/BrowserImpl";
import { getGuiInstance } from "@/app/stores/GuiImpl";
import { shouldShowReleaseToast } from "@/app/use-cases";
import { PLUME_CONSTANTS } from "@/domain/plume";
import { coreActions } from "@/domain/ports/app-core";
import { guiActions } from "@/domain/ports/plume-ui";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

const initPlayback = () => {
  // BC's native play button is clicked to trigger its own internal playback bootstrap
  const bcPlayer = getBcPlayerInstance();
  const playButton = bcPlayer.getPlayPauseButton();
  if (playButton) {
    playButton.click();
  } else {
    logger(CPL.WARN, getString("WARN__PLAY_PAUSE__NOT_FOUND"));
  }
};

const findAudioElement = async (): Promise<HTMLAudioElement | null> => {
  const bcPlayer = getBcPlayerInstance();
  const audio = bcPlayer.getAudioElement();
  if (!audio) return null;
  logger(CPL.INFO, getString("INFO__AUDIO__FOUND"), audio);

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
    stickiness: null,
    tracklist: null,
    hotkeys: null,
    toast: null,
  };

  const isInitializedRef = { value: false };
  let isInitializing = false;
  let audioRetryCount = 0;
  let audioToastHandle: ToastHandle | null = null;

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

    const healthResult = checkBandcampElements();
    if (healthResult.allRequiredFound) {
      logger(CPL.INFO, getString("INFO__BC_HEALTH_CHECK__ALL_FOUND"));
    } else {
      const missingRequiredCount = healthResult.missing.filter((el) => el.required).length;
      createToast({
        label: getString("META__TOAST__HEALTH_CHECK"),
        title: getString("LABEL__TOAST__HEALTH_CHECK__TITLE", [String(missingRequiredCount)]),
        description: getString("LABEL__TOAST__HEALTH_CHECK__DESCRIPTION"),
        borderType: "error",
      });

      isInitializing = false;
      return;
    }

    const audioElement = await findAudioElement();
    if (!audioElement) {
      audioRetryCount++;
      logger(CPL.WARN, getString("WARN__AUDIO_ELEMENT__NOT_FOUND"));
      if (audioRetryCount >= PLUME_CONSTANTS.AUDIO_RETRY_TOAST_THRESHOLD && !audioToastHandle) {
        audioToastHandle = createToast({
          label: getString("META__TOAST__AUDIO_NOT_FOUND"),
          title: getString("LABEL__TOAST__AUDIO_NOT_FOUND__TITLE"),
          description: getString("LABEL__TOAST__AUDIO_NOT_FOUND__DESCRIPTION"),
          borderType: "warning",
        });
      }
      isInitializing = false;
      setTimeout(init, PLUME_CONSTANTS.AUDIO_RETRY_MS);
      return;
    }
    audioRetryCount = 0;
    audioToastHandle?.dismiss();
    audioToastHandle = null;

    // Make audio element available before loading persisted state so that MusicPlayerAdapter calls (e.g. setLoop) inside the thunk don't throw.
    plumeUi.dispatch(guiActions.setAudioElement(audioElement));

    // Set pageType before loading persisted state so the COLLECTION→TRACK guard in loadPersistedState works on track/single pages.
    const isAlbumPage = globalThis.location.pathname.startsWith("/album/");
    appCore.dispatch(coreActions.setPageType(isAlbumPage ? "album" : "track"));

    // Load persisted state into store
    await appCore.loadPersistedState();

    // Apply the persisted volume to the audio element after the state has been loaded.
    audioElement.volume = appCore.getState().volume;

    const plumeIsAlreadyInjected = isPlumeInjected();
    if (plumeIsAlreadyInjected) {
      isInitializing = false;
      isInitializedRef.value = true;
      return;
    }

    // Duration display method is already loaded from persisted state
    const durationDisplayMethod = appCore.getState().durationDisplayMethod;
    logger(CPL.INFO, getString("INFO__DURATION_DISPLAY_METHOD__APPLIED", [durationDisplayMethod]));

    const { ok: isInjected, tracklistCleanup } = await injectEnhancements();
    if (!isInjected) {
      createToast({
        label: getString("META__TOAST__INJECTION_FAILED"),
        title: getString("LABEL__TOAST__INJECTION_FAILED__TITLE"),
        description: getString("LABEL__TOAST__INJECTION_FAILED__DESCRIPTION"),
        borderType: "error",
      });
      isInitializing = false;
      return;
    }
    handles.tracklist = tracklistCleanup ?? null;

    const browserCache = getBrowserInstance().getState().cache;
    if (await shouldShowReleaseToast(browserCache)) showReleaseToast();

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
