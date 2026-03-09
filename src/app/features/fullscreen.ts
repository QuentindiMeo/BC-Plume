import { APP_VERSION, PLUME_KO_FI_URL } from "../../domain/meta";
import { LoopModeType, PLUME_CONSTANTS } from "../../domain/plume";
import { coreActions } from "../../domain/ports/app-core";
import { PLUME_ELEM_SELECTORS } from "../../infra/elements/plume";
import { guiActions } from "../../infra/Gui";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { PLUME_SVG } from "../../svg/icons";
import { getBcPlayerInstance, getMusicPlayerInstance } from "../stores/adapters";
import { getAppCoreInstance } from "../stores/AppCoreImpl";
import { getGuiInstance } from "../stores/GuiImpl";
import { seekToProgress, setVolume, toggleDurationDisplay } from "../use-cases";
import { CleanupCallback, SubscriptionCallback } from "./types";
import { applyLoopBtnState, handleLoopCycle } from "./ui/loop";
import {
  handlePlayPause,
  handleTimeBackward,
  handleTimeForward,
  handleTrackBackward,
  handleTrackForward,
} from "./ui/playback";
import { handleMuteToggle } from "./ui/volume";

const { PROGRESS_SLIDER_GRANULARITY, VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

interface FullscreenElements {
  headerContainer: HTMLDivElement;
  progressSlider: HTMLInputElement;
  elapsedDisplay: HTMLSpanElement;
  durationDisplay: HTMLSpanElement;
  playPauseBtn: HTMLButtonElement;
  volumeSlider: HTMLInputElement;
  volumeDisplay: HTMLDivElement;
  muteBtn: HTMLButtonElement;
  trackBackwardBtn: HTMLButtonElement;
  timeBackwardBtn: HTMLButtonElement;
  timeForwardBtn: HTMLButtonElement;
  trackForwardBtn: HTMLButtonElement;
  loopBtn: HTMLButtonElement;
}

let fullscreenCleanupCallback: CleanupCallback | null = null;

const exitFullscreenMode = (): void => {
  const plumeUi = getGuiInstance();
  const existingOverlay = plumeUi.getState().fullscreenOverlay;
  if (!existingOverlay) return;

  const appCore = getAppCoreInstance();
  appCore.dispatch(coreActions.setIsFullscreen(false));

  // Cleanup store subscriptions BEFORE removing DOM to prevent updates to non-existent elements
  if (fullscreenCleanupCallback) {
    fullscreenCleanupCallback();
    fullscreenCleanupCallback = null;
  }

  // Clear the fullscreen-specific buttons from the store arrays before removing the DOM
  const plume = plumeUi.getState();
  plumeUi.dispatch(
    guiActions.setPlayPauseBtns(plume.playPauseBtns.filter((btn) => existingOverlay.contains(btn) === false))
  );
  plumeUi.dispatch(
    guiActions.setTrackFwdBtns(plume.trackFwdBtns.filter((btn) => existingOverlay.contains(btn) === false))
  );
  plumeUi.dispatch(guiActions.setLoopBtns(plume.loopBtns.filter((btn) => existingOverlay.contains(btn) === false)));
  plumeUi.dispatch(guiActions.setFullscreenOverlay(null));
  existingOverlay.remove();
  document.body.style.overflow = "auto";
};

export const cleanupFullscreenMode = exitFullscreenMode;

const renderVolume = (elements: FullscreenElements, volume: number): void => {
  if (!elements.volumeSlider || !elements.volumeDisplay) {
    logger(CPL.ERROR, getString("ERROR__VOLUME_SLIDER_OR_DISPLAY__NOT_FOUND"));
    return;
  }

  elements.volumeSlider.value = Math.round(volume * VOLUME_SLIDER_GRANULARITY).toString();
  elements.volumeDisplay.textContent = `${elements.volumeSlider.value}${getString("META__PERCENTAGE")}`;
};

const renderMuteButton = (elements: FullscreenElements, isMuted: boolean): void => {
  if (!elements.muteBtn) {
    logger(CPL.ERROR, getString("ERROR__MUTE_BUTTON__NOT_FOUND"));
    return;
  }

  elements.muteBtn.innerHTML = isMuted ? PLUME_SVG.volumeMuted : PLUME_SVG.volumeOn;
  elements.muteBtn.title = isMuted ? getString("ARIA__UNMUTE") : getString("ARIA__MUTE");
  elements.muteBtn.ariaLabel = isMuted ? getString("ARIA__UNMUTE") : getString("ARIA__MUTE");
  elements.muteBtn.ariaPressed = isMuted.toString();
  elements.muteBtn.classList.toggle("muted", isMuted);
};

const renderPlayPauseButton = (elements: FullscreenElements, isPlaying: boolean): void => {
  if (!elements.playPauseBtn) {
    logger(CPL.ERROR, getString("ERROR__PLAY_PAUSE_BUTTON__NOT_FOUND"));
    return;
  }

  elements.playPauseBtn.innerHTML = isPlaying ? PLUME_SVG.playPause : PLUME_SVG.playPlay;
};

const renderElapsedDisplay = (elements: FullscreenElements, formattedElapsed: string): void => {
  if (!elements.elapsedDisplay) {
    logger(CPL.ERROR, getString("ERROR__ELAPSED_DISPLAY__NOT_FOUND"));
    return;
  }

  elements.elapsedDisplay.textContent = formattedElapsed;
};

const renderDurationDisplay = (elements: FullscreenElements, formattedDuration: string): void => {
  if (!elements.durationDisplay) {
    logger(CPL.ERROR, getString("ERROR__DURATION_DISPLAY__NOT_FOUND"));
    return;
  }

  elements.durationDisplay.textContent = formattedDuration;
};

const renderProgressSlider = (elements: FullscreenElements, progressPercentage: number): void => {
  if (!elements.progressSlider) {
    logger(CPL.ERROR, getString("ERROR__PROGRESS_SLIDER__NOT_FOUND"));
    return;
  }

  const bgPercent = progressPercentage < 50 ? progressPercentage + 1 : progressPercentage - 1;
  const bgImg = `linear-gradient(90deg, var(--progbar-fill-bg-left) ${bgPercent.toFixed(1)}%, var(--progbar-bg) 0%)`;
  elements.progressSlider.value = `${progressPercentage * (PROGRESS_SLIDER_GRANULARITY / 100)}`;
  elements.progressSlider.style.backgroundImage = bgImg;
};

const renderTrackTitle = (elements: FullscreenElements, trackTitle: string | null): void => {
  if (!elements.headerContainer || !trackTitle) {
    logger(CPL.ERROR, getString("ERROR__HEADER_CONTAINER_OR_TRACK_TITLE__NOT_FOUND"));
    return;
  }

  const headerTitle = elements.headerContainer.querySelector(PLUME_ELEM_SELECTORS.headerTitle) as HTMLSpanElement;
  if (!headerTitle) {
    logger(CPL.ERROR, getString("ERROR__HEADER_TITLE__NOT_FOUND"));
    return;
  }

  headerTitle.textContent = trackTitle;
  headerTitle.title = trackTitle;
};

const renderTrackNumber = (elements: FullscreenElements, trackNumber: string | null): void => {
  const header = elements.headerContainer;
  if (!header || !trackNumber) {
    logger(CPL.ERROR, getString("ERROR__HEADER_CONTAINER_OR_TRACK_NUMBER__NOT_FOUND"));
    return;
  }

  const headerPretext = header.querySelector(PLUME_ELEM_SELECTORS.headerTitlePretext) as HTMLSpanElement;
  if (!headerPretext) {
    logger(CPL.ERROR, getString("ERROR__HEADER_PRETEXT__NOT_FOUND"));
    return;
  }

  headerPretext.textContent = trackNumber;
};

const getFullscreenElements = (clone: HTMLElement): FullscreenElements => {
  return {
    headerContainer: clone.querySelector(PLUME_ELEM_SELECTORS.headerContainer) as HTMLDivElement,
    progressSlider: clone.querySelector(PLUME_ELEM_SELECTORS.progressSlider) as HTMLInputElement,
    elapsedDisplay: clone.querySelector(PLUME_ELEM_SELECTORS.elapsedDisplay) as HTMLSpanElement,
    durationDisplay: clone.querySelector(PLUME_ELEM_SELECTORS.durationDisplay) as HTMLSpanElement,
    playPauseBtn: clone.querySelector(PLUME_ELEM_SELECTORS.playPauseBtn) as HTMLButtonElement,
    volumeSlider: clone.querySelector(PLUME_ELEM_SELECTORS.volumeSlider) as HTMLInputElement,
    volumeDisplay: clone.querySelector(PLUME_ELEM_SELECTORS.volumeValue) as HTMLDivElement,
    muteBtn: clone.querySelector(PLUME_ELEM_SELECTORS.muteBtn) as HTMLButtonElement,
    trackBackwardBtn: clone.querySelector(PLUME_ELEM_SELECTORS.trackBwdBtn) as HTMLButtonElement,
    timeBackwardBtn: clone.querySelector(PLUME_ELEM_SELECTORS.timeBwdBtn) as HTMLButtonElement,
    timeForwardBtn: clone.querySelector(PLUME_ELEM_SELECTORS.timeFwdBtn) as HTMLButtonElement,
    trackForwardBtn: clone.querySelector(PLUME_ELEM_SELECTORS.trackFwdBtn) as HTMLButtonElement,
    loopBtn: clone.querySelector(PLUME_ELEM_SELECTORS.loopBtn) as HTMLButtonElement,
  };
};

const renderLoopButton = (elements: FullscreenElements, loopMode: LoopModeType): void => {
  if (!elements.loopBtn) {
    logger(CPL.ERROR, getString("ERROR__LOOP_BUTTON__NOT_FOUND"));
    return;
  }
  applyLoopBtnState(elements.loopBtn, loopMode);
};

// Setup store subscriptions for fullscreen UI to keep it in sync with state
const setupFullscreenUi = (clone: HTMLElement): CleanupCallback => {
  const plume = getGuiInstance().getState();
  const appCore = getAppCoreInstance();

  const subscriptions: Array<SubscriptionCallback> = [];
  const elements: FullscreenElements = getFullscreenElements(clone);

  // Subscribe to state changes and use pure rendering functions for updates
  subscriptions.push(
    appCore.subscribe("currentTime", () => {
      renderProgressSlider(elements, appCore.computed.progressPercentage());
      renderElapsedDisplay(elements, appCore.computed.formattedElapsed());
      renderDurationDisplay(elements, appCore.computed.formattedDuration());
    }),
    appCore.subscribe("duration", () => {
      renderDurationDisplay(elements, appCore.computed.formattedDuration());
    }),
    appCore.subscribe("durationDisplayMethod", () => {
      renderDurationDisplay(elements, appCore.computed.formattedDuration());
    }),
    appCore.subscribe("isPlaying", (isPlaying) => {
      renderPlayPauseButton(elements, isPlaying);
    }),
    appCore.subscribe("volume", (volume) => {
      renderVolume(elements, volume);
    }),
    appCore.subscribe("isMuted", (isMuted) => {
      renderMuteButton(elements, isMuted);
    }),
    appCore.subscribe("trackTitle", (trackTitle) => {
      renderTrackTitle(elements, trackTitle);
    }),
    appCore.subscribe("trackNumber", (trackNumber) => {
      renderTrackNumber(elements, trackNumber);
    }),
    appCore.subscribe("loopMode", (loopMode) => {
      renderLoopButton(elements, loopMode);
    }),
    appCore.subscribe("pageType", () => {
      renderLoopButton(elements, appCore.getState().loopMode);
    })
  );

  const handleProgressInput = function (this: HTMLInputElement) {
    const musicPlayer = getMusicPlayerInstance();
    seekToProgress(Number.parseFloat(this.value), appCore, musicPlayer);
  };

  const handleVolumeInput = function (this: HTMLInputElement) {
    setVolume(Number.parseInt(this.value), appCore);
  };

  const handleFullscreenDurationClick = () => {
    toggleDurationDisplay(appCore);
  };

  // Setup event listeners for fullscreen controls
  // The listeners are automatically cleaned up when the overlay DOM is removed on exit.
  elements.progressSlider.addEventListener("input", handleProgressInput);
  elements.durationDisplay.addEventListener("click", handleFullscreenDurationClick);
  elements.trackBackwardBtn.addEventListener("click", handleTrackBackward);
  elements.timeBackwardBtn.addEventListener("click", handleTimeBackward);
  elements.playPauseBtn.addEventListener("click", handlePlayPause);
  elements.timeForwardBtn.addEventListener("click", handleTimeForward);
  elements.trackForwardBtn.addEventListener("click", handleTrackForward);
  elements.volumeSlider.addEventListener("input", handleVolumeInput);
  elements.muteBtn.addEventListener("click", handleMuteToggle);
  elements.loopBtn.addEventListener("click", handleLoopCycle);

  // Initialize fullscreen UI with current state using the same rendering functions
  const state = appCore.getState();

  // Safe use of innerHTML to clone DOM content from controlled element
  elements.headerContainer.innerHTML = plume.titleDisplay.innerHTML;

  // Apply initial state using pure rendering functions (same logic as subscriptions)
  renderProgressSlider(elements, appCore.computed.progressPercentage());
  renderElapsedDisplay(elements, appCore.computed.formattedElapsed());
  renderDurationDisplay(elements, appCore.computed.formattedDuration());
  renderPlayPauseButton(elements, state.isPlaying);
  renderVolume(elements, state.volume);
  renderMuteButton(elements, state.isMuted);
  renderTrackTitle(elements, state.trackTitle);
  renderTrackNumber(elements, state.trackNumber);
  renderLoopButton(elements, state.loopMode);

  // Return cleanup function to unsubscribe all listeners
  return () => {
    subscriptions.forEach((unsubscribe) => unsubscribe());
  };
};

// Pure DOM construction function - builds fullscreen overlay without side effects
const buildFullscreenOverlay = (isAlbumPage: boolean): HTMLDivElement | null => {
  const bcPlayer = getBcPlayerInstance();
  const artworkUrl = bcPlayer.getArtworkUrl();
  if (!artworkUrl) {
    logger(CPL.WARN, getString("WARN__COVER_ART__NOT_FOUND"));
    return null;
  }

  const overlay = document.createElement("div");
  overlay.id = PLUME_ELEM_SELECTORS.fullscreenOverlay.split("#")[1];

  // Create background with cover art (blurred and dimmed)
  const background = document.createElement("div");
  background.id = PLUME_ELEM_SELECTORS.fullscreenBackground.split("#")[1];
  background.style.backgroundImage = `url("${encodeURI(artworkUrl)}")`;
  overlay.appendChild(background);

  const contentContainer = document.createElement("div");
  contentContainer.id = PLUME_ELEM_SELECTORS.fullscreenContent.split("#")[1];

  const presentationContainer = document.createElement("div");
  presentationContainer.id = PLUME_ELEM_SELECTORS.fullscreenPresentationContainer.split("#")[1];

  const coverArtImg = document.createElement("img");
  coverArtImg.id = PLUME_ELEM_SELECTORS.fullscreenCoverArt.split("#")[1];
  coverArtImg.src = artworkUrl;
  coverArtImg.alt = getString("ARIA__COVER_ART");
  presentationContainer.appendChild(coverArtImg);

  const newNameSection = bcPlayer.getInfoSection() as HTMLDivElement | null;
  if (!newNameSection) {
    logger(CPL.WARN, getString("WARN__INFO_SECTION__NOT_FOUND"));
    return null;
  }

  // Clone returns Node, but we know it's an HTMLDivElement with the same structure as the original
  const adjustedNameSection = newNameSection.cloneNode(true) as HTMLDivElement;
  adjustedNameSection.className = PLUME_ELEM_SELECTORS.fullscreenTitlingContainer.split(".")[1];
  const headTitle = adjustedNameSection.querySelector("h2")!;
  headTitle.id = PLUME_ELEM_SELECTORS.fullscreenTitlingProject.split("#")[1];
  if (!isAlbumPage) headTitle.textContent = `"${headTitle.textContent?.trim()}"`;

  presentationContainer.appendChild(adjustedNameSection);
  contentContainer.appendChild(presentationContainer);

  // Clone the plume module (right side)
  const plume = getGuiInstance().getState();
  const plumeContainer = plume.plumeContainer;
  if (!plumeContainer) {
    logger(CPL.WARN, getString("WARN__PLUME_CONTAINER__NOT_FOUND"));
    return null;
  }

  // Clone returns Node, but we know it's an HTMLDivElement with the same structure as the original
  const plumeClone = plumeContainer.cloneNode(true) as HTMLDivElement;
  plumeClone.id = PLUME_ELEM_SELECTORS.fullscreenClone.split("#")[1];

  const fullscreenLogo = document.createElement("a");
  fullscreenLogo.id = PLUME_ELEM_SELECTORS.headerLogo.split("#")[1];
  fullscreenLogo.innerHTML = PLUME_SVG.logo + `<p id="${fullscreenLogo.id}__version">${APP_VERSION}</p>`;
  fullscreenLogo.href = PLUME_KO_FI_URL;
  fullscreenLogo.target = "_blank";
  fullscreenLogo.rel = "noopener noreferrer";
  fullscreenLogo.ariaLabel = getString("ARIA__APP_NAME");
  fullscreenLogo.title = getString("ARIA__LOGO_LINK");
  fullscreenLogo.tabIndex = 0;
  plumeClone.insertBefore(fullscreenLogo, plumeClone.firstChild);

  // Hide the fullscreen button section in the cloned module
  const clonedFullscreenBtn = plumeClone.querySelector(
    PLUME_ELEM_SELECTORS.fullscreenBtnContainer
  ) as HTMLButtonElement;
  clonedFullscreenBtn.style.display = "none";

  contentContainer.appendChild(plumeClone);
  overlay.appendChild(contentContainer);

  // Create exit fullscreen button in top right corner
  const exitBtn = document.createElement("button");
  exitBtn.id = PLUME_ELEM_SELECTORS.fullscreenExitBtn.split("#")[1];
  exitBtn.type = "button";
  exitBtn.innerHTML = PLUME_SVG.fullscreenExit;
  exitBtn.title = getString("ARIA__EXIT_FULLSCREEN_BTN");
  exitBtn.ariaLabel = getString("ARIA__EXIT_FULLSCREEN_BTN");
  exitBtn.addEventListener("click", toggleFullscreenMode);
  overlay.appendChild(exitBtn);

  return overlay;
};

// Setup keyboard navigation for fullscreen overlay
const setupFullscreenFocusTrap = (overlay: HTMLDivElement): void => {
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

  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.code === "Escape") toggleFullscreenMode();
  };

  overlay.addEventListener("keydown", handleTabKey);
  overlay.addEventListener("keydown", handleEscapeKey);

  setTimeout(() => {
    const initialFocusable = getFocusableElements()[0];
    initialFocusable?.focus();
  }, 0);
};

// State-driven fullscreen toggle
export const toggleFullscreenMode = (): void => {
  const appCore = getAppCoreInstance();
  const plumeUi = getGuiInstance();
  const plume = plumeUi.getState();
  const isCurrentlyFullscreen = !!plume.fullscreenOverlay;

  if (isCurrentlyFullscreen) {
    exitFullscreenMode();
    logger(CPL.INFO, getString("INFO__FULLSCREEN__EXITED"));
    return;
  }

  // Enter fullscreen - dispatch state change first, then build DOM
  const isAlbumPage = appCore.getState().pageType === "album";

  const overlay = buildFullscreenOverlay(isAlbumPage);
  if (!overlay) {
    // Failed to build overlay - revert state
    appCore.dispatch(coreActions.setIsFullscreen(false));
    return;
  }

  const plumeClone = overlay.querySelector(`#${PLUME_ELEM_SELECTORS.fullscreenClone.split("#")[1]}`) as HTMLDivElement;
  fullscreenCleanupCallback = setupFullscreenUi(plumeClone);

  // Register the fullscreen buttons in the store alongside the main-panel buttons
  const fsElements = getFullscreenElements(plumeClone);
  plumeUi.dispatch(guiActions.setPlayPauseBtns([...plume.playPauseBtns, fsElements.playPauseBtn]));
  plumeUi.dispatch(guiActions.setTrackFwdBtns([...plume.trackFwdBtns, fsElements.trackForwardBtn]));
  plumeUi.dispatch(guiActions.setLoopBtns([...plume.loopBtns, fsElements.loopBtn]));

  // Mount overlay to DOM and record it in the store
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
  setupFullscreenFocusTrap(overlay);

  plumeUi.dispatch(guiActions.setFullscreenOverlay(overlay));
  appCore.dispatch(coreActions.setIsFullscreen(true));

  logger(CPL.INFO, getString("INFO__FULLSCREEN__ENTERED"));
};
