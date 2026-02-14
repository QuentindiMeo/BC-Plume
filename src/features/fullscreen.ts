import { BC_ELEM_IDENTIFIERS, TIME_DISPLAY_METHOD } from "../domain/bandcamp";
import { APP_NAME, APP_VERSION, PLUME_KO_FI_URL } from "../domain/meta";
import { PLUME_CONSTANTS, PLUME_ELEM_IDENTIFIERS } from "../domain/plume";
import { getPlumeUiInstance, PLUME_ACTION_TYPES } from "../infra/AppInstanceImpl";
import { getStoreInstance, STORE_ACTION_TYPES } from "../infra/AppStoreImpl";
import { PLUME_SVG } from "../svg/icons";
import { getFormattedDuration, getFormattedElapsed, getProgressPercentage } from "./formatting";
import { getString } from "./i18n";
import { CPL, logger } from "./logger";
import { CleanupCallback, SubscriptionCallback } from "./types";
import {
  handlePlayPause,
  handleTimeBackward,
  handleTimeForward,
  handleTrackBackward,
  handleTrackForward,
} from "./ui/playback";
import { handleMuteToggle } from "./ui/volume";

const { PROGRESS_SLIDER_GRANULARITY, VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

let fullscreenCleanupCallback: CleanupCallback | null = null;

export const cleanupFullscreenMode = (): void => {
  const existingOverlay = document.querySelector(PLUME_ELEM_IDENTIFIERS.fullscreenOverlay) as HTMLDivElement;
  if (existingOverlay) {
    // Cleanup store subscriptions BEFORE removing DOM to prevent updates to non-existent elements
    if (fullscreenCleanupCallback) {
      fullscreenCleanupCallback();
      fullscreenCleanupCallback = null;
    }

    existingOverlay.remove();
    document.body.style.overflow = "auto";
    getStoreInstance().dispatch({ type: STORE_ACTION_TYPES.SET_IS_FULLSCREEN, payload: false });
  }
};

// Setup store subscriptions for fullscreen UI to keep it in sync with state
const setupFullscreenUi = (clone: HTMLElement): CleanupCallback => {
  const plume = getPlumeUiInstance().getState();
  const store = getStoreInstance();
  const subscriptions: Array<SubscriptionCallback> = [];

  const cloneEl = {
    headerContainer: clone.querySelector(PLUME_ELEM_IDENTIFIERS.headerContainer) as HTMLDivElement,
    progressSlider: clone.querySelector(PLUME_ELEM_IDENTIFIERS.progressSlider) as HTMLInputElement,
    elapsedDisplay: clone.querySelector(PLUME_ELEM_IDENTIFIERS.elapsedDisplay) as HTMLSpanElement,
    durationDisplay: clone.querySelector(PLUME_ELEM_IDENTIFIERS.durationDisplay) as HTMLSpanElement,
    playPauseBtn: clone.querySelector(PLUME_ELEM_IDENTIFIERS.playPauseBtn) as HTMLButtonElement,
    volumeSlider: clone.querySelector(PLUME_ELEM_IDENTIFIERS.volumeSlider) as HTMLInputElement,
    volumeDisplay: clone.querySelector(PLUME_ELEM_IDENTIFIERS.volumeValue) as HTMLDivElement,
    muteBtn: clone.querySelector(PLUME_ELEM_IDENTIFIERS.muteBtn) as HTMLButtonElement,
    trackBackwardBtn: clone.querySelector(PLUME_ELEM_IDENTIFIERS.trackBwdBtn) as HTMLButtonElement,
    timeBackwardBtn: clone.querySelector(PLUME_ELEM_IDENTIFIERS.timeBwdBtn) as HTMLButtonElement,
    timeForwardBtn: clone.querySelector(PLUME_ELEM_IDENTIFIERS.timeFwdBtn) as HTMLButtonElement,
    trackForwardBtn: clone.querySelector(PLUME_ELEM_IDENTIFIERS.trackFwdBtn) as HTMLButtonElement,
  };

  const updateFullscreenDuration = () => {
    if (!cloneEl.durationDisplay) return;
    const state = store.getState();
    cloneEl.durationDisplay.textContent = getFormattedDuration(state);
  };
  subscriptions.push(
    // Subscribe to progress updates
    store.subscribe("currentTime", () => {
      const state = store.getState();
      if (!cloneEl.progressSlider) return;

      const percent = getProgressPercentage(state);
      const bgPercent = percent < 50 ? percent + 1 : percent - 1;
      const bgImg = `linear-gradient(90deg, var(--progbar-fill-bg-left) ${bgPercent.toFixed(1)}%, var(--progbar-bg) 0%)`;
      cloneEl.progressSlider.value = `${percent * (PROGRESS_SLIDER_GRANULARITY / 100)}`;
      cloneEl.progressSlider.style.backgroundImage = bgImg;
    }),
    // Subscribe to elapsed time display
    store.subscribe("currentTime", () => {
      if (!cloneEl.elapsedDisplay) return;
      const state = store.getState();
      cloneEl.elapsedDisplay.textContent = getFormattedElapsed(state);
    }),
    // Subscribe to duration display (updates on both duration and display method changes)
    store.subscribe("duration", updateFullscreenDuration),
    store.subscribe("durationDisplayMethod", updateFullscreenDuration),
    store.subscribe("currentTime", updateFullscreenDuration),
    // Subscribe to play/pause state
    store.subscribe("isPlaying", (isPlaying) => {
      if (!cloneEl.playPauseBtn) return;
      cloneEl.playPauseBtn.innerHTML = isPlaying ? PLUME_SVG.playPause : PLUME_SVG.playPlay;
    }),
    // Subscribe to volume changes
    store.subscribe("volume", (volume) => {
      if (!cloneEl.volumeSlider || !cloneEl.volumeDisplay) return;
      cloneEl.volumeSlider.value = Math.round(volume * VOLUME_SLIDER_GRANULARITY).toString();
      cloneEl.volumeDisplay.textContent = `${cloneEl.volumeSlider.value}${getString("META__PERCENTAGE")}`;
    }),
    // Subscribe to mute state
    store.subscribe("isMuted", (isMuted) => {
      if (!cloneEl.muteBtn) return;
      cloneEl.muteBtn.innerHTML = isMuted ? PLUME_SVG.volumeMuted : PLUME_SVG.volumeOn;
      cloneEl.muteBtn.title = isMuted ? getString("ARIA__UNMUTE") : getString("ARIA__MUTE");
      cloneEl.muteBtn.ariaLabel = isMuted ? getString("ARIA__UNMUTE") : getString("ARIA__MUTE");
      cloneEl.muteBtn.ariaPressed = isMuted.toString();
      cloneEl.muteBtn.classList.toggle("muted", isMuted);
    }),
    // Subscribe to track title changes
    store.subscribe("trackTitle", (trackTitle) => {
      if (!cloneEl.headerContainer || !trackTitle) return;
      const cloneHeaderTitle = cloneEl.headerContainer.querySelector(
        PLUME_ELEM_IDENTIFIERS.headerTitle
      ) as HTMLSpanElement;
      if (cloneHeaderTitle) {
        cloneHeaderTitle.textContent = trackTitle;
        cloneHeaderTitle.title = trackTitle;
      }
    }),
    // Subscribe to track number changes
    store.subscribe("trackNumber", (trackNumber) => {
      if (!cloneEl.headerContainer || !trackNumber) return;
      const cloneHeaderPretext = cloneEl.headerContainer.querySelector(
        PLUME_ELEM_IDENTIFIERS.headerTitlePretext
      ) as HTMLSpanElement;
      if (cloneHeaderPretext) {
        cloneHeaderPretext.textContent = trackNumber;
      }
    })
  );

  const handleProgressInput = function (this: HTMLInputElement) {
    const plumeUi = getPlumeUiInstance();
    const progress = Number.parseFloat(this.value) / PROGRESS_SLIDER_GRANULARITY;

    plume.audioElement.currentTime = progress * (plume.audioElement.duration || 0);
    if (plume.audioElement.paused) {
      setTimeout(() => {
        plume.audioElement.pause();
      }, 10);
    }
    plumeUi.dispatch({ type: PLUME_ACTION_TYPES.SET_PROGRESS_SLIDER, payload: cloneEl.progressSlider });
  };

  const handleVolumeInput = function (this: HTMLInputElement) {
    const plumeUi = getPlumeUiInstance();
    const newVolume = Number.parseInt(this.value) / VOLUME_SLIDER_GRANULARITY;
    plume.audioElement.volume = newVolume;
    plumeUi.dispatch({ type: PLUME_ACTION_TYPES.SET_VOLUME_SLIDER, payload: cloneEl.volumeSlider });

    // Moving slider off zero counts as an intentional unmute
    if (newVolume > 0 && store.getState().isMuted) {
      store.dispatch({ type: STORE_ACTION_TYPES.SET_IS_MUTED, payload: false });
    }

    store.dispatch({ type: STORE_ACTION_TYPES.SET_VOLUME, payload: newVolume });
  };

  const handleFullscreenDurationClick = () => {
    const currentMethod = store.getState().durationDisplayMethod;
    const newMethod =
      currentMethod === TIME_DISPLAY_METHOD.DURATION ? TIME_DISPLAY_METHOD.REMAINING : TIME_DISPLAY_METHOD.DURATION;

    store.dispatch({
      type: STORE_ACTION_TYPES.SET_DURATION_DISPLAY_METHOD,
      payload: newMethod,
    });
  };

  // Setup event listeners for fullscreen controls
  // The listeners are automatically cleaned up when the overlay DOM is removed on exit.
  cloneEl.progressSlider.addEventListener("input", handleProgressInput);
  cloneEl.durationDisplay.addEventListener("click", handleFullscreenDurationClick);
  cloneEl.trackBackwardBtn.addEventListener("click", handleTrackBackward);
  cloneEl.timeBackwardBtn.addEventListener("click", handleTimeBackward);
  cloneEl.playPauseBtn.addEventListener("click", handlePlayPause);
  cloneEl.timeForwardBtn.addEventListener("click", handleTimeForward);
  cloneEl.trackForwardBtn.addEventListener("click", handleTrackForward);
  cloneEl.volumeSlider.addEventListener("input", handleVolumeInput);
  cloneEl.muteBtn.addEventListener("click", handleMuteToggle);

  // Initialize fullscreen UI with current state
  const state = store.getState();
  // Safe use of innerHTML to clone DOM content from controlled element
  cloneEl.headerContainer.innerHTML = plume.titleDisplay.innerHTML;
  // Initialize track number in fullscreen
  if (state.trackNumber && cloneEl.headerContainer) {
    const cloneHeaderPretext = cloneEl.headerContainer.querySelector(
      PLUME_ELEM_IDENTIFIERS.headerTitlePretext
    ) as HTMLSpanElement;
    if (cloneHeaderPretext) {
      cloneHeaderPretext.textContent = state.trackNumber;
    }
  }
  updateFullscreenDuration();
  if (cloneEl.elapsedDisplay) {
    cloneEl.elapsedDisplay.textContent = getFormattedElapsed(state);
  }
  if (cloneEl.volumeSlider && cloneEl.volumeDisplay) {
    cloneEl.volumeSlider.value = Math.round(state.volume * VOLUME_SLIDER_GRANULARITY).toString();
    cloneEl.volumeDisplay.textContent = `${cloneEl.volumeSlider.value}${getString("META__PERCENTAGE")}`;
  }
  if (cloneEl.muteBtn) {
    cloneEl.muteBtn.innerHTML = state.isMuted ? PLUME_SVG.volumeMuted : PLUME_SVG.volumeOn;
    cloneEl.muteBtn.title = state.isMuted ? getString("ARIA__UNMUTE") : getString("ARIA__MUTE");
    cloneEl.muteBtn.ariaLabel = state.isMuted ? getString("ARIA__UNMUTE") : getString("ARIA__MUTE");
    cloneEl.muteBtn.ariaPressed = state.isMuted.toString();
    cloneEl.muteBtn.classList.toggle("muted", state.isMuted);
  }
  if (cloneEl.playPauseBtn) {
    cloneEl.playPauseBtn.innerHTML = state.isPlaying ? PLUME_SVG.playPause : PLUME_SVG.playPlay;
  }

  // Return cleanup function to unsubscribe all listeners
  return () => {
    subscriptions.forEach((unsubscribe) => unsubscribe());
  };
};

export const toggleFullscreenMode = (): void => {
  const store = getStoreInstance();
  const isAlbumPage = store.getState().pageType === "album";
  const existingOverlay = document.querySelector(PLUME_ELEM_IDENTIFIERS.fullscreenOverlay) as HTMLDivElement;
  const alreadyHasFullscreenOverlay = !!existingOverlay;

  if (alreadyHasFullscreenOverlay) {
    // Cleanup store subscriptions BEFORE removing DOM to prevent updates to non-existent elements
    if (fullscreenCleanupCallback) {
      fullscreenCleanupCallback();
      fullscreenCleanupCallback = null;
    }

    existingOverlay.remove();
    document.body.style.overflow = "auto";

    store.dispatch({ type: STORE_ACTION_TYPES.SET_IS_FULLSCREEN, payload: false });
    logger(CPL.INFO, getString("INFO__FULLSCREEN__EXITED"));
    return;
  }

  // Enter fullscreen
  const coverArt = document.querySelector(BC_ELEM_IDENTIFIERS.coverArt) as HTMLImageElement;
  if (!coverArt) {
    logger(CPL.WARN, getString("WARN__COVER_ART__NOT_FOUND"));
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = PLUME_ELEM_IDENTIFIERS.fullscreenOverlay.split("#")[1];

  // Create background with cover art (blurred and dimmed)
  const background = document.createElement("div");
  background.id = PLUME_ELEM_IDENTIFIERS.fullscreenBackground.split("#")[1];
  const coverArtUrl = encodeURI(coverArt.src);
  background.style.backgroundImage = `url("${coverArtUrl}")`;
  overlay.appendChild(background);

  const contentContainer = document.createElement("div");
  contentContainer.id = PLUME_ELEM_IDENTIFIERS.fullscreenContent.split("#")[1];

  const presentationContainer = document.createElement("div");
  presentationContainer.id = PLUME_ELEM_IDENTIFIERS.fullscreenPresentationContainer.split("#")[1];

  const coverArtImg = document.createElement("img");
  coverArtImg.id = PLUME_ELEM_IDENTIFIERS.fullscreenCoverArt.split("#")[1];
  coverArtImg.src = coverArt.src;
  coverArtImg.alt = getString("ARIA__COVER_ART");
  presentationContainer.appendChild(coverArtImg);

  const newNameSection = document.querySelector(BC_ELEM_IDENTIFIERS.infoSection) as HTMLDivElement;
  if (!newNameSection) {
    logger(CPL.WARN, getString("WARN__INFO_SECTION__NOT_FOUND"));
    return;
  }

  // Clone returns Node, but we know it's an HTMLDivElement with the same structure as the original
  const adjustedNameSection = newNameSection.cloneNode(true) as HTMLDivElement;
  adjustedNameSection.className = PLUME_ELEM_IDENTIFIERS.fullscreenTitlingContainer.split(".")[1]; // as class because id is already used by BC
  const headTitle = adjustedNameSection.querySelector("h2")!;
  headTitle.id = PLUME_ELEM_IDENTIFIERS.fullscreenTitlingProject.split("#")[1];
  if (!isAlbumPage) headTitle.textContent = '"' + headTitle.textContent.trim() + '"';

  presentationContainer.appendChild(adjustedNameSection);
  contentContainer.appendChild(presentationContainer);

  // Clone the plume module (right side)
  const plumeContainer = document.querySelector(PLUME_ELEM_IDENTIFIERS.plumeContainer) as HTMLDivElement;
  if (!plumeContainer) {
    logger(CPL.WARN, getString("WARN__PLUME_CONTAINER__NOT_FOUND"));
    return;
  }

  // Clone returns Node, but we know it's an HTMLDivElement with the same structure as the original
  const plumeClone = plumeContainer.cloneNode(true) as HTMLDivElement;
  plumeClone.id = PLUME_ELEM_IDENTIFIERS.fullscreenClone.split("#")[1];

  const fullscreenLogo = document.createElement("a");
  fullscreenLogo.id = PLUME_ELEM_IDENTIFIERS.headerLogo.split("#")[1];
  fullscreenLogo.innerHTML = PLUME_SVG.logo + `<p id="${fullscreenLogo.id}__version">${APP_VERSION}</p>`;
  fullscreenLogo.href = PLUME_KO_FI_URL;
  fullscreenLogo.target = "_blank";
  fullscreenLogo.rel = "noopener noreferrer";
  fullscreenLogo.ariaLabel = APP_NAME;
  fullscreenLogo.title = getString("ARIA__LOGO_LINK");
  fullscreenLogo.tabIndex = 0;
  plumeClone.insertBefore(fullscreenLogo, plumeClone.firstChild);

  // Hide the fullscreen button section in the cloned module
  const clonedFullscreenBtn = plumeClone.querySelector(
    PLUME_ELEM_IDENTIFIERS.fullscreenBtnContainer
  ) as HTMLButtonElement;
  clonedFullscreenBtn.style.display = "none";

  contentContainer.appendChild(plumeClone);
  overlay.appendChild(contentContainer);

  // Create exit fullscreen button in top right corner
  const exitBtn = document.createElement("button");
  exitBtn.id = PLUME_ELEM_IDENTIFIERS.fullscreenExitBtn.split("#")[1];
  exitBtn.type = "button";
  exitBtn.innerHTML = PLUME_SVG.fullscreenExit;
  exitBtn.title = getString("ARIA__EXIT_FULLSCREEN_BTN");
  exitBtn.ariaLabel = getString("ARIA__EXIT_FULLSCREEN_BTN");
  exitBtn.addEventListener("click", toggleFullscreenMode);
  overlay.appendChild(exitBtn);

  // Setup keyboard navigation for fullscreen overlay
  // Note: These listeners are on the overlay element and are automatically
  // cleaned up when the overlay is removed from DOM on exit
  const setupFullscreenFocusTrap = () => {
    const getFocusableElements = () => {
      return Array.from(
        overlay.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    };

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.code !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements.at(-1);
      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable || currentIndex === -1) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else if (document.activeElement === lastFocusable || currentIndex === -1) {
        e.preventDefault();
        firstFocusable.focus();
      }
    };

    overlay.addEventListener("keydown", handleTabKey);

    setTimeout(() => {
      const initialFocusable = getFocusableElements()[0];
      initialFocusable?.focus();
    }, 0);
  };

  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.code === "Escape") toggleFullscreenMode();
  };
  overlay.addEventListener("keydown", handleEscapeKey);

  // Setup store subscriptions for fullscreen UI - cleanup function stored for later
  fullscreenCleanupCallback = setupFullscreenUi(plumeClone);

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
  setupFullscreenFocusTrap();

  store.dispatch({ type: STORE_ACTION_TYPES.SET_IS_FULLSCREEN, payload: true });
  logger(CPL.INFO, getString("INFO__FULLSCREEN__ENTERED"));
};
