// Plume - TypeScript for song page and album page display
import { BC_ELEM_IDENTIFIERS, DebugControl, TIME_DISPLAY_METHOD, TimeDisplayMethodType } from "./domain/bandcamp";
import { APP_NAME, APP_VERSION, PLUME_KO_FI_URL } from "./domain/meta";
import { PLUME_CONSTANTS, PLUME_ELEM_IDENTIFIERS } from "./domain/plume";
import { getFormattedDuration, getFormattedElapsed, getProgressPercentage } from "./features/formatting";
import { getString, logDetectedBrowser } from "./features/i18n";
import { setupHotkeys } from "./features/keyboard";
import { CPL, logger } from "./features/logger";
import {
  findOriginalPlayerContainer,
  hideOriginalPlayerElements,
  restoreOriginalPlayerElements,
} from "./features/original-player";
import { getInfoSectionWithRuntime } from "./features/runtime";
import { getTrackQuantifiers } from "./features/track-quantifiers";
import { createFullscreenButtonSection, setupPlayerStickiness } from "./features/ui";
import {
  adjustColorContrast,
  FALLBACK_GRAY_RGB_STR,
  isGrayscale,
  measureContrastRatioWCAG,
  RGBToHSL,
  WCAG_CONTRAST_NORMAL,
} from "./features/utils/colors";
import { getPlumeUiInstance, PLUME_ACTION_TYPES } from "./infra/AppInstanceImpl";
import { getStoreInstance, STORE_ACTION_TYPES } from "./infra/AppStoreImpl";
import { PLUME_SVG } from "./svg/icons";
import { CleanupCallback, SubscriptionCallback } from "./types";

const { PROGRESS_SLIDER_GRANULARITY, TIME_BEFORE_RESTART, VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

(() => {
  "use strict";

  logDetectedBrowser();
  const store = getStoreInstance();
  const plumeUiInstance = getPlumeUiInstance();

  const isAlbumPage = globalThis.location.pathname.includes("/album/");

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

  // Setup store subscriptions for fullscreen UI to keep it in sync with state
  const setupFullscreen = (clone: HTMLElement): CleanupCallback => {
    const plume = plumeUiInstance.getState();
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
      const progress = Number.parseFloat(this.value) / PROGRESS_SLIDER_GRANULARITY;

      plume.audioElement.currentTime = progress * (plume.audioElement.duration || 0);
      if (plume.audioElement.paused) {
        setTimeout(() => {
          plume.audioElement.pause();
        }, 10);
      }
    };

    const handleVolumeInput = function (this: HTMLInputElement) {
      const newVolume = Number.parseInt(this.value) / VOLUME_SLIDER_GRANULARITY;
      plume.audioElement.volume = newVolume;

      // Moving slider off zero counts as an intentional unmute
      if (newVolume > 0 && store.getState().isMuted) {
        store.dispatch({ type: STORE_ACTION_TYPES.SET_IS_MUTED, payload: false });
      }

      store.dispatch({ type: STORE_ACTION_TYPES.SET_VOLUME, payload: newVolume });
    };

    // Setup event listeners for fullscreen controls
    // The listeners are automatically cleaned up when the overlay DOM is removed on exit.
    cloneEl.progressSlider.addEventListener("input", handleProgressInput);
    cloneEl.durationDisplay.addEventListener("click", handleDurationChange);
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

  let fullscreenCleanupCallback: (() => void) | null = null;
  const toggleFullscreenMode = () => {
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
    fullscreenCleanupCallback = setupFullscreen(plumeClone);

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    setupFullscreenFocusTrap();

    store.dispatch({ type: STORE_ACTION_TYPES.SET_IS_FULLSCREEN, payload: true });
    logger(CPL.INFO, getString("INFO__FULLSCREEN__ENTERED"));
  };

  // Sync mute button icon and aria-label to reflect the current audio volume state
  const syncMuteBtn = (isMuted: boolean) => {
    const plume = plumeUiInstance.getState();
    const newMuteBtn = plume.muteBtn;

    newMuteBtn.innerHTML = isMuted ? PLUME_SVG.volumeMuted : PLUME_SVG.volumeOn;
    newMuteBtn.title = isMuted ? getString("ARIA__UNMUTE") : getString("ARIA__MUTE");
    newMuteBtn.ariaLabel = isMuted ? getString("ARIA__UNMUTE") : getString("ARIA__MUTE");
    newMuteBtn.ariaPressed = isMuted.toString();
    newMuteBtn.classList.toggle("muted", isMuted);
    plumeUiInstance.dispatch({ type: PLUME_ACTION_TYPES.SET_MUTE_BTN, payload: newMuteBtn });
  };

  const handleMuteToggle = () => {
    store.dispatch({ type: STORE_ACTION_TYPES.TOGGLE_MUTE });
  };

  // Function to create the volume slider
  const createVolumeSlider = async (): Promise<HTMLDivElement | null> => {
    const plume = plumeUiInstance.getState();
    if (plume.volumeSlider) return null;

    const container = document.createElement("div");
    container.id = PLUME_ELEM_IDENTIFIERS.volumeContainer.split("#")[1];

    const muteBtn = document.createElement("button");
    muteBtn.id = PLUME_ELEM_IDENTIFIERS.muteBtn.split("#")[1];
    muteBtn.type = "button";
    muteBtn.title = getString("ARIA__MUTE");
    muteBtn.ariaLabel = getString("ARIA__MUTE");
    muteBtn.ariaPressed = "false";
    muteBtn.innerHTML = PLUME_SVG.volumeOn;

    const volumeSlider = document.createElement("input");
    volumeSlider.id = PLUME_ELEM_IDENTIFIERS.volumeSlider.split("#")[1];
    volumeSlider.type = "range";
    volumeSlider.min = "0";
    volumeSlider.max = VOLUME_SLIDER_GRANULARITY.toString();
    const currentVolume = store.getState().volume;
    volumeSlider.value = Math.round(currentVolume * VOLUME_SLIDER_GRANULARITY).toString();
    volumeSlider.ariaLabel = getString("ARIA__VOLUME_SLIDER");

    // Apply saved volume to audio element
    plume.audioElement.volume = currentVolume;

    const valueDisplay = document.createElement("div");
    valueDisplay.id = PLUME_ELEM_IDENTIFIERS.volumeValue.split("#")[1];
    valueDisplay.textContent = `${volumeSlider.value}${getString("META__PERCENTAGE")}`;

    muteBtn.addEventListener("click", handleMuteToggle);

    // Event listener for volume change via slider
    volumeSlider.addEventListener("input", function (this: HTMLInputElement) {
      const volume = Number.parseInt(this.value) / VOLUME_SLIDER_GRANULARITY;

      plume.audioElement.volume = volume;
      valueDisplay.textContent = `${this.value}${getString("META__PERCENTAGE")}`;

      // Moving slider off zero counts as an intentional unmute
      if (volume > 0 && store.getState().isMuted) {
        store.dispatch({ type: STORE_ACTION_TYPES.SET_IS_MUTED, payload: false });
      }

      store.dispatch({ type: STORE_ACTION_TYPES.SET_VOLUME, payload: volume });
    });

    container.appendChild(muteBtn);
    container.appendChild(volumeSlider);
    container.appendChild(valueDisplay);

    plumeUiInstance.dispatch({ type: PLUME_ACTION_TYPES.SET_VOLUME_SLIDER, payload: volumeSlider });
    plumeUiInstance.dispatch({ type: PLUME_ACTION_TYPES.SET_MUTE_BTN, payload: muteBtn });
    return container;
  };

  const isFirstTrackOfAlbumPlaying = () => {
    const trackList = document.querySelector(BC_ELEM_IDENTIFIERS.trackList) as HTMLTableElement;
    const firstTrackRow = trackList.querySelector(BC_ELEM_IDENTIFIERS.trackRow) as HTMLTableRowElement;
    const firstTrackTitleElem = firstTrackRow.querySelector(BC_ELEM_IDENTIFIERS.trackTitle) as HTMLSpanElement;
    const currentTrackTitleElem = document.querySelector(
      BC_ELEM_IDENTIFIERS.albumPageCurrentTrackTitle
    ) as HTMLAnchorElement;
    if (!currentTrackTitleElem) return false;

    return firstTrackTitleElem?.textContent === currentTrackTitleElem.textContent;
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

  // Function to click on the previous track button
  const clickPreviousTrackButton = (): true | null => {
    const plume = plumeUiInstance.getState();

    const prevButton = document.querySelector(BC_ELEM_IDENTIFIERS.previousTrack) as HTMLButtonElement;
    if (!prevButton) {
      logger(CPL.WARN, getString("WARN__PREV_TRACK__NOT_FOUND"));
      return null;
    }

    const firstTrackIsPlaying = !isAlbumPage || isFirstTrackOfAlbumPlaying();
    if (plume.audioElement.currentTime < TIME_BEFORE_RESTART && !firstTrackIsPlaying) {
      prevButton.click();
    } else {
      // Restart current track instead, if more than X seconds have elapsed
      plume.audioElement.currentTime = 0;
      logger(CPL.INFO, getString("DEBUG__PREV_TRACK__RESTARTED"));
      setPauseBtnIcon();
    }
    return true;
  };

  // Function to click on the next track button
  const clickNextTrackButton = (): true | null => {
    const nextButton = document.querySelector(BC_ELEM_IDENTIFIERS.nextTrack) as HTMLButtonElement;
    if (!nextButton) {
      logger(CPL.WARN, getString("WARN__NEXT_TRACK__NOT_FOUND"));
      return null;
    }

    nextButton.click();
    logger(CPL.DEBUG, getString("DEBUG__NEXT_TRACK__CLICKED"));
    setPauseBtnIcon();
    return true;
  };

  const TIME_STEP_DURATION = 10; // seconds to skip forward/backward
  const createPlaybackControls = () => {
    const plume = plumeUiInstance.getState();
    const container = document.createElement("div");
    container.id = PLUME_ELEM_IDENTIFIERS.playbackControls.split("#")[1];

    const trackBackwardBtn = document.createElement("button");
    trackBackwardBtn.id = PLUME_ELEM_IDENTIFIERS.trackBwdBtn.split("#")[1];
    trackBackwardBtn.type = "button";
    trackBackwardBtn.innerHTML = PLUME_SVG.trackBackward;
    trackBackwardBtn.title = getString("LABEL__TRACK_BACKWARD");
    trackBackwardBtn.addEventListener("click", handleTrackBackward);

    const timeBackwardBtn = document.createElement("button");
    timeBackwardBtn.id = PLUME_ELEM_IDENTIFIERS.timeBwdBtn.split("#")[1];
    timeBackwardBtn.type = "button";
    timeBackwardBtn.innerHTML = PLUME_SVG.timeBackward;
    timeBackwardBtn.title = getString("LABEL__TIME_BACKWARD");
    timeBackwardBtn.addEventListener("click", handleTimeBackward);

    const playPauseBtn = document.createElement("button");
    playPauseBtn.id = PLUME_ELEM_IDENTIFIERS.playPauseBtn.split("#")[1];
    playPauseBtn.type = "button";
    playPauseBtn.innerHTML = plume.audioElement.paused ? PLUME_SVG.playPlay : PLUME_SVG.playPause;
    playPauseBtn.title = getString("LABEL__PLAY_PAUSE");
    playPauseBtn.addEventListener("click", handlePlayPause);

    const timeForwardBtn = document.createElement("button");
    timeForwardBtn.id = PLUME_ELEM_IDENTIFIERS.timeFwdBtn.split("#")[1];
    timeForwardBtn.type = "button";
    timeForwardBtn.innerHTML = PLUME_SVG.timeForward;
    timeForwardBtn.title = getString("LABEL__TIME_FORWARD");
    timeForwardBtn.addEventListener("click", handleTimeForward);

    const trackForwardBtn = document.createElement("button");
    trackForwardBtn.id = PLUME_ELEM_IDENTIFIERS.trackFwdBtn.split("#")[1];
    trackForwardBtn.type = "button";
    trackForwardBtn.innerHTML = PLUME_SVG.trackForward;
    trackForwardBtn.title = getString("LABEL__TRACK_FORWARD");
    trackForwardBtn.addEventListener("click", handleTrackForward);

    container.appendChild(trackBackwardBtn);
    container.appendChild(timeBackwardBtn);
    container.appendChild(playPauseBtn);
    container.appendChild(timeForwardBtn);
    container.appendChild(trackForwardBtn);

    return container;
  };

  const handleTrackBackward = () => {
    logger(CPL.DEBUG, getString("DEBUG__PREV_TRACK__CLICKED"));

    const rv = clickPreviousTrackButton();
    if (rv === null) return; // previous track button not found
    logger(CPL.DEBUG, getString("DEBUG__PREV_TRACK__DISPATCHED"));
  };

  const handleTimeBackward = () => {
    const plume = plumeUiInstance.getState();
    logger(CPL.DEBUG, getString("DEBUG__REWIND_TIME__CLICKED"));

    const newTime = Math.max(0, plume.audioElement.currentTime - TIME_STEP_DURATION);
    plume.audioElement.currentTime = newTime;
    if (plume.audioElement.paused)
      setTimeout(() => {
        plume.audioElement.pause(); // prevent auto-play when rewinding on paused track
      }, 10);

    logger(
      CPL.DEBUG,
      `${getString("DEBUG__REWIND_TIME__DISPATCHED1")} ${Math.round(newTime)}${getString(
        "DEBUG__REWIND_TIME__DISPATCHED2"
      )}`
    );
  };

  const handlePlayPause = () => {
    const plume = plumeUiInstance.getState();
    if (plume.audioElement.paused) {
      plume.audioElement.play();
      store.dispatch({ type: STORE_ACTION_TYPES.SET_IS_PLAYING, payload: true });
    } else {
      plume.audioElement.pause();
      store.dispatch({ type: STORE_ACTION_TYPES.SET_IS_PLAYING, payload: false });
    }
  };

  const handleTimeForward = () => {
    const plume = plumeUiInstance.getState();
    logger(CPL.DEBUG, getString("DEBUG__FORWARD_TIME__CLICKED"));

    const newTime = Math.min(plume.audioElement.duration || 0, plume.audioElement.currentTime + TIME_STEP_DURATION);
    plume.audioElement.currentTime = newTime;
    if (plume.audioElement.paused)
      setTimeout(() => {
        plume.audioElement.pause(); // prevent auto-play when forwarding on paused track
      }, 10);

    logger(
      CPL.DEBUG,
      `${getString("DEBUG__FORWARD_TIME__DISPATCHED1")} ${Math.round(newTime)}${getString(
        "DEBUG__FORWARD_TIME__DISPATCHED2"
      )}`
    );
  };

  const handleTrackForward = () => {
    logger(CPL.DEBUG, getString("DEBUG__NEXT_TRACK__CLICKED"));

    const rv = clickNextTrackButton();
    if (rv === null) return; // next track button not found
    logger(CPL.DEBUG, getString("DEBUG__NEXT_TRACK__DISPATCHED"));
  };

  const saveDurationDisplayMethod = (newMethod: TimeDisplayMethodType) => {
    const plume = plumeUiInstance.getState();
    store.dispatch({ type: STORE_ACTION_TYPES.SET_DURATION_DISPLAY_METHOD, payload: newMethod });

    const player = plume.audioElement;

    // Update current time in store for accurate remaining time calculation
    store.dispatch({ type: STORE_ACTION_TYPES.SET_CURRENT_TIME, payload: player.currentTime });
    store.dispatch({ type: STORE_ACTION_TYPES.SET_DURATION, payload: player.duration });

    const state = store.getState();
    plume.durationDisplay.textContent = getFormattedDuration(state);
  };

  const createProgressContainer = async () => {
    const plume = plumeUiInstance.getState();
    if (plume.progressSlider) return;

    const container = document.createElement("div");
    container.id = PLUME_ELEM_IDENTIFIERS.progressContainer.split("#")[1];
    const progressSlider = document.createElement("input");
    progressSlider.id = PLUME_ELEM_IDENTIFIERS.progressSlider.split("#")[1];
    progressSlider.type = "range";
    progressSlider.min = "0";
    progressSlider.max = PROGRESS_SLIDER_GRANULARITY.toString();
    progressSlider.value = "0";
    progressSlider.ariaLabel = getString("ARIA__PROGRESS_SLIDER");

    const timeDisplay = document.createElement("div");
    timeDisplay.id = PLUME_ELEM_IDENTIFIERS.timeDisplay.split("#")[1];

    const elapsed = document.createElement("span");
    elapsed.id = PLUME_ELEM_IDENTIFIERS.elapsedDisplay.split("#")[1];
    elapsed.textContent = "0:00";

    const duration = document.createElement("span");
    duration.textContent = "0:00";
    duration.title = getString("LABEL__TIME_DISPLAY__INVERT");
    duration.id = PLUME_ELEM_IDENTIFIERS.durationDisplay.split("#")[1];

    timeDisplay.appendChild(elapsed);
    timeDisplay.appendChild(duration);

    container.appendChild(progressSlider);
    container.appendChild(timeDisplay);

    duration.addEventListener("click", handleDurationChange);
    progressSlider.addEventListener("input", function (this: HTMLInputElement) {
      const progress = Number.parseFloat(this.value) / PROGRESS_SLIDER_GRANULARITY;
      plume.audioElement.currentTime = progress * (plume.audioElement.duration || 0);
      if (plume.audioElement.paused) {
        setTimeout(() => {
          plume.audioElement.pause(); // prevent auto-play when seeking on paused track
        }, 10);
      }
    });

    plumeUiInstance.dispatch({ type: PLUME_ACTION_TYPES.SET_PROGRESS_SLIDER, payload: progressSlider });
    plumeUiInstance.dispatch({ type: PLUME_ACTION_TYPES.SET_ELAPSED_DISPLAY, payload: elapsed });
    plumeUiInstance.dispatch({ type: PLUME_ACTION_TYPES.SET_DURATION_DISPLAY, payload: duration });

    return container;
  };

  const handleDurationChange = () => {
    const currentMethod = store.getState().durationDisplayMethod;
    saveDurationDisplayMethod(
      currentMethod === TIME_DISPLAY_METHOD.DURATION ? TIME_DISPLAY_METHOD.REMAINING : TIME_DISPLAY_METHOD.DURATION
    );
  };

  const getArtistNameElement = (): HTMLSpanElement => {
    const infoSection = document.querySelector(BC_ELEM_IDENTIFIERS.infoSection) as HTMLDivElement;
    const infoSectionLinks = infoSection.querySelectorAll("span");
    const artistElementIdx = infoSectionLinks.length - 1; // idx should be 0 if album page, 1 if track page
    return infoSectionLinks[artistElementIdx].querySelector("a")! as HTMLSpanElement;
  };

  const getTrackTitleElement = (): HTMLSpanElement => {
    return document.querySelector(BC_ELEM_IDENTIFIERS.songPageCurrentTrackTitle) as HTMLSpanElement;
  };

  const getAppropriatePretextColor = (): string => {
    const trackColor = getComputedStyle(getTrackTitleElement()).color;
    const artistColor = getComputedStyle(getArtistNameElement()).color;
    const trackColorMatch = trackColor.match(/\d+/g);
    const artistColorMatch = artistColor.match(/\d+/g);

    // Fallback to gray if color regex matching fails
    if (!trackColorMatch || !artistColorMatch) {
      return FALLBACK_GRAY_RGB_STR;
    }

    const trackColorRGB = trackColorMatch.map(Number) as [number, number, number];
    const artistColorRGB = artistColorMatch.map(Number) as [number, number, number];
    const trackColorContrast = measureContrastRatioWCAG(trackColorRGB);
    const artistColorContrast = measureContrastRatioWCAG(artistColorRGB);
    if (trackColorContrast > WCAG_CONTRAST_NORMAL && artistColorContrast > WCAG_CONTRAST_NORMAL) {
      const trackColorSaturation = RGBToHSL(...trackColorRGB)[1];
      const artistColorSaturation = RGBToHSL(...artistColorRGB)[1];
      return trackColorSaturation > artistColorSaturation ? trackColor : artistColor;
    } else if (trackColorContrast > WCAG_CONTRAST_NORMAL || artistColorContrast > WCAG_CONTRAST_NORMAL) {
      return trackColorContrast > WCAG_CONTRAST_NORMAL ? trackColor : artistColor;
    } else {
      const preferredColor = trackColorContrast > artistColorContrast ? trackColor : artistColor;
      const preferredColorMatch = preferredColor.match(/\d+/g);
      if (!preferredColorMatch) {
        return FALLBACK_GRAY_RGB_STR;
      }
      const preferredColorRgb = preferredColorMatch.map(Number) as [number, number, number];
      if (isGrayscale(preferredColorRgb)) return FALLBACK_GRAY_RGB_STR;
      return adjustColorContrast(preferredColorRgb, WCAG_CONTRAST_NORMAL);
    }
  };

  // Function to get the current track title from Bandcamp
  const getCurrentTrackTitle = (): string => {
    const titleElement = isAlbumPage
      ? (document.querySelector(BC_ELEM_IDENTIFIERS.albumPageCurrentTrackTitle) as HTMLSpanElement)
      : (document.querySelector(BC_ELEM_IDENTIFIERS.songPageCurrentTrackTitle) as HTMLSpanElement);
    if (!titleElement?.textContent) return getString("LABEL__TRACK_UNKNOWN");

    return titleElement.textContent.trim();
  };

  const injectEnhancements = async () => {
    const bcPlayerContainer = findOriginalPlayerContainer();
    if (!bcPlayerContainer) {
      logger(CPL.ERROR, getString("ERROR__UNABLE_TO_FIND_CONTAINER"));
      return;
    }

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

    const initialTrackTitle = getCurrentTrackTitle();
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

    const progressContainer = await createProgressContainer();
    if (progressContainer) {
      playbackManager.appendChild(progressContainer);
    }
    const playbackControls = createPlaybackControls();
    if (playbackControls) {
      playbackManager.appendChild(playbackControls);
    }
    plumeContainer.appendChild(playbackManager);

    const volumeContainer = await createVolumeSlider();
    if (volumeContainer) {
      plumeContainer.appendChild(volumeContainer);
    }

    const fullscreenBtnSection = createFullscreenButtonSection(toggleFullscreenMode);
    plumeContainer.appendChild(fullscreenBtnSection);

    bcPlayerContainer.appendChild(plumeContainer);

    logger(CPL.LOG, getString("LOG__MOUNT__COMPLETE"));

    if (isAlbumPage) addRuntime();
  };

  const setPauseBtnIcon = () => {
    const playPauseBtns: NodeListOf<HTMLButtonElement> = document.querySelectorAll(PLUME_ELEM_IDENTIFIERS.playPauseBtn);
    playPauseBtns.forEach((btn) => (btn.innerHTML = PLUME_SVG.playPause));
  };

  const updateTrackForwardBtnState = () => {
    const trackFwdBtns: NodeListOf<HTMLButtonElement> = document.querySelectorAll(PLUME_ELEM_IDENTIFIERS.trackFwdBtn);
    if (trackFwdBtns.length === 0) return;

    const shouldDisable = !isAlbumPage || isLastTrackOfAlbumPlaying();
    trackFwdBtns.forEach((btn) => (btn.disabled = shouldDisable));
  };

  // Function to update the pretext display (track numbering)
  const updatePretextDisplay = () => {
    const plume = plumeUiInstance.getState();
    const preText = plume.titleDisplay?.querySelector(PLUME_ELEM_IDENTIFIERS.headerTitlePretext) as HTMLSpanElement;
    if (!preText) return;

    const newTrackTitle = getCurrentTrackTitle();
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

    const newTrackTitle = getCurrentTrackTitle();
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

  // Function to update the progress bar and time displays as audio plays or metadata change
  const updateProgressBar = () => {
    const plume = plumeUiInstance.getState();
    const elapsed = plume.audioElement.currentTime;
    const duration = plume.audioElement.duration;

    // Update store with current playback state (batched for performance)
    store.dispatch({
      type: STORE_ACTION_TYPES.UPDATE_PLAYBACK_PROGRESS,
      payload: { currentTime: elapsed, duration },
    });

    if (Number.isNaN(elapsed) || Number.isNaN(duration)) return;

    const state = store.getState();
    const percent = getProgressPercentage(state);
    const bgPercent = percent < 50 ? percent + 1 : percent - 1; // or else it under/overflows
    const bgImg = `linear-gradient(90deg, var(--progbar-fill-bg-left) ${bgPercent.toFixed(1)}%, var(--progbar-bg) 0%)`;
    plume.progressSlider.value = `${percent * (PROGRESS_SLIDER_GRANULARITY / 100)}`;
    plume.progressSlider.style.backgroundImage = bgImg;

    plume.elapsedDisplay.textContent = getFormattedElapsed(state);

    plume.durationDisplay.textContent = getFormattedDuration(state);
  };

  // Function to set up event listeners on the audio element: progress, metadata, volume
  const setupAudioListeners = () => {
    const plume = plumeUiInstance.getState();
    // Update progress container
    plume.audioElement.addEventListener("timeupdate", updateProgressBar);
    plume.audioElement.addEventListener("loadedmetadata", updateProgressBar);
    plume.audioElement.addEventListener("durationchange", updateProgressBar);

    // Update title when metadata loads (new track)
    plume.audioElement.addEventListener("loadedmetadata", updateTitleDisplay);
    plume.audioElement.addEventListener("loadedmetadata", updatePretextDisplay);
    plume.audioElement.addEventListener("loadedmetadata", updateTrackForwardBtnState);
    plume.audioElement.addEventListener("loadstart", updateTitleDisplay);
    plume.audioElement.addEventListener("loadstart", updatePretextDisplay);
    plume.audioElement.addEventListener("loadstart", updateTrackForwardBtnState);

    // Sync volume slider and mute button with external volume changes
    plume.audioElement.addEventListener("volumechange", () => {
      if (!plume.volumeSlider) return;

      const currentVolume = plume.audioElement.volume;
      plume.volumeSlider.value = `${Math.round(currentVolume * VOLUME_SLIDER_GRANULARITY)}`;
      const valueDisplay = plume.volumeSlider.parentElement!.querySelector(
        PLUME_ELEM_IDENTIFIERS.volumeValue
      ) as HTMLSpanElement;
      if (valueDisplay) {
        valueDisplay.textContent = `${plume.volumeSlider.value}${getString("META__PERCENTAGE")}`;
      }

      const isMuted = currentVolume === 0;
      if (store.getState().isMuted !== isMuted) {
        store.dispatch({ type: STORE_ACTION_TYPES.SET_IS_MUTED, payload: isMuted });
      }
      store.dispatch({ type: STORE_ACTION_TYPES.SET_VOLUME, payload: currentVolume });
    });

    // Track play/pause state changes from audio element
    plume.audioElement.addEventListener("play", () => {
      store.dispatch({ type: STORE_ACTION_TYPES.SET_IS_PLAYING, payload: true });
    });

    plume.audioElement.addEventListener("pause", () => {
      store.dispatch({ type: STORE_ACTION_TYPES.SET_IS_PLAYING, payload: false });
    });

    logger(CPL.INFO, getString("INFO__AUDIO_EVENT_LISTENERS__SET_UP"));
  };

  // Load duration display method from store (already loaded during init)
  const loadDurationDisplayMethod = async (): Promise<TimeDisplayMethodType> => {
    return store.getState().durationDisplayMethod;
  };

  // Setup store subscriptions for reactive UI updates
  // Returns cleanup function to unsubscribe all subscriptions
  const setupStoreSubscriptions = (): CleanupCallback => {
    const plume = plumeUiInstance.getState();
    const subscriptions: Array<SubscriptionCallback> = [];

    subscriptions.push(
      // Subscribe to volume changes to update audio element
      store.subscribe("volume", (volume) => {
        plume.audioElement.volume = volume;
      }),
      // Subscribe to duration display method changes to update display
      store.subscribe("durationDisplayMethod", () => {
        updateProgressBar();
      }),
      // Subscribe to mute state changes
      store.subscribe("isMuted", (isMuted) => {
        syncMuteBtn(isMuted);

        // Update volume slider and display
        const currentVolume = store.getState().volume;
        plume.volumeSlider.value = Math.round(currentVolume * VOLUME_SLIDER_GRANULARITY).toString();

        const valueDisplay = plume.volumeSlider.parentElement?.querySelector(
          PLUME_ELEM_IDENTIFIERS.volumeValue
        ) as HTMLDivElement | null;
        if (valueDisplay) {
          valueDisplay.textContent = `${plume.volumeSlider.value}${getString("META__PERCENTAGE")}`;
        }

        // Update audio element volume
        plume.audioElement.volume = store.getState().volume;
      }),
      // Subscribe to playing state changes
      store.subscribe("isPlaying", (isPlaying) => {
        const playPauseBtns = document.querySelectorAll(PLUME_ELEM_IDENTIFIERS.playPauseBtn);
        playPauseBtns.forEach((btn) => {
          btn.innerHTML = isPlaying ? PLUME_SVG.playPause : PLUME_SVG.playPlay;
        });
      })
    );

    logger(CPL.INFO, getString("INFO__STATE__SUBSCRIPTIONS_SETUP"));

    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  };

  // Main initialization function
  let isInitializing = false;
  let isInitialized = false;
  let storeCleanupCallback: (() => void) | null = null;
  let keyboardCleanupCallback: (() => void) | null = null;
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

    // Load persisted state into store
    store.loadPersistedState();

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

    // Ensure duration display method is applied
    const durationDisplayMethod = await loadDurationDisplayMethod();
    logger(CPL.INFO, `${getString("INFO__TIME_DISPLAY_METHOD__APPLIED")} "${durationDisplayMethod}"`);

    // Inject enhancements
    await injectEnhancements();
    setupAudioListeners();
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

          // Ensure duration display method is applied
          const durationDisplayMethod = await loadDurationDisplayMethod();
          logger(CPL.INFO, `${getString("INFO__TIME_DISPLAY_METHOD__APPLIED")} "${durationDisplayMethod}"`);

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
    const existingOverlay = document.querySelector(PLUME_ELEM_IDENTIFIERS.fullscreenOverlay) as HTMLDivElement;
    if (existingOverlay) {
      // Cleanup store subscriptions BEFORE removing DOM to prevent updates to non-existent elements
      if (fullscreenCleanupCallback) {
        fullscreenCleanupCallback();
        fullscreenCleanupCallback = null;
      }

      existingOverlay.remove();
      document.body.style.overflow = "auto";
      store.dispatch({ type: STORE_ACTION_TYPES.SET_IS_FULLSCREEN, payload: false });
    }

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
    if (fullscreenCleanupCallback) {
      fullscreenCleanupCallback();
      fullscreenCleanupCallback = null;
    }

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
  });
})();
