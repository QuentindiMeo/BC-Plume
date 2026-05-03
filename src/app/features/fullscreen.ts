import { getAppropriateAccentColor } from "@/app/features/track-title";
import { CleanupCallback, SubscriptionCallback } from "@/app/features/types";
import { applyLoopBtnState, handleLoopCycle } from "@/app/features/ui/loop";
import {
  applyPlaybackControlsSize,
  handlePlayPause,
  handleSpeedCycle,
  handleSpeedSlider,
  handleSpeedSliderKeydown,
  handleTimeBackward,
  handleTimeForward,
  handleTrackBackward,
  handleTrackForward,
  setupSpeedLabelClickBehavior,
  setupSpeedPopoverBehavior,
} from "@/app/features/ui/playback";
import { syncBpmDisplay, wireDetectAllBpmButton } from "@/app/features/ui/bpm-display";
import { createToast } from "@/app/features/ui/toast";
import { createTracklistToggle } from "@/app/features/ui/tracklist";
import { handleMuteToggle } from "@/app/features/ui/volume";
import { getBcPlayerInstance, getMusicPlayerInstance } from "@/app/stores/adapters";
import { getAppCoreInstance } from "@/app/stores/AppCoreImpl";
import { getGuiInstance } from "@/app/stores/GuiImpl";
import {
  runVisualizer,
  seekToProgress,
  setVolume,
  stopVisualizer,
  syncVisualizerWithPlayback,
  toggleDurationDisplay,
} from "@/app/use-cases";
import { APP_VERSION, PLUME_LINKTREE_URL } from "@/domain/meta";
import { LoopModeType, PLUME_CONSTANTS } from "@/domain/plume";
import { coreActions } from "@/domain/ports/app-core";
import { guiActions } from "@/domain/ports/plume-ui";
import { PLUME_ELEM_SELECTORS } from "@/infra/elements/plume";
import { getActiveLocale, getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";
import { presentFormattedTime } from "@/shared/presenters";
import { applyTitleLang } from "@/shared/script-lang";
import { createSafeSvgElement, setSvgContent } from "@/shared/svg";
import { PLUME_SVG } from "@/svg/icons";

const { PROGRESS_SLIDER_GRANULARITY, VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

interface FullscreenElements {
  headerContainer: HTMLDivElement;
  progressSlider: HTMLInputElement;
  elapsedDisplay: HTMLSpanElement;
  durationDisplay: HTMLButtonElement;
  speedWrapper: HTMLDivElement;
  speedBtn: HTMLButtonElement;
  speedSlider: HTMLInputElement;
  trackBackwardBtn: HTMLButtonElement;
  timeBackwardBtn: HTMLButtonElement;
  playPauseBtn: HTMLButtonElement;
  timeForwardBtn: HTMLButtonElement;
  trackForwardBtn: HTMLButtonElement;
  loopBtn: HTMLButtonElement;
  muteBtn: HTMLButtonElement;
  volumeSlider: HTMLInputElement;
  volumeDisplay: HTMLDivElement;
}

let fullscreenCleanupCallback: CleanupCallback | null = null;

let fullscreenLiveRegion: HTMLDivElement | null = null;
const announceFullscreenState = (messageKey: string): void => {
  if (!fullscreenLiveRegion) {
    fullscreenLiveRegion = document.createElement("div");
    fullscreenLiveRegion.role = "status";
    fullscreenLiveRegion.ariaLive = "polite";
    fullscreenLiveRegion.className = "sr-live";
    fullscreenLiveRegion.lang = getActiveLocale();
    document.body.appendChild(fullscreenLiveRegion);
  }
  // Clear then set to ensure re-announcement even if the same message is sent twice
  fullscreenLiveRegion.textContent = "";
  requestAnimationFrame(() => {
    fullscreenLiveRegion!.textContent = getString(messageKey);
  });
};

const exitFullscreenMode = (): void => {
  const plumeUi = getGuiInstance();
  const existingOverlay = plumeUi.getState().fullscreenOverlay;
  if (!existingOverlay) return;

  const appCore = getAppCoreInstance();
  appCore.dispatch(coreActions.setIsFullscreen(false));

  stopVisualizer();

  // Cleanup store subscriptions BEFORE removing DOM to prevent updates to non-existent elements
  if (fullscreenCleanupCallback) {
    fullscreenCleanupCallback();
    fullscreenCleanupCallback = null;
  }

  // Clear the fullscreen-specific buttons from the store arrays before removing the DOM
  const plume = plumeUi.getState();
  plumeUi.dispatch(guiActions.setSpeedBtns(plume.speedBtns.filter((w) => existingOverlay.contains(w) === false)));
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
  elements.volumeSlider.setAttribute(
    "aria-valuetext",
    `${elements.volumeSlider.value}${getString("META__PERCENTAGE")}`
  );
  elements.volumeDisplay.textContent = `${elements.volumeSlider.value}${getString("META__PERCENTAGE")}`;
};

const renderMuteButton = (elements: FullscreenElements, isMuted: boolean): void => {
  if (!elements.muteBtn) {
    logger(CPL.ERROR, getString("ERROR__MUTE_BUTTON__NOT_FOUND"));
    return;
  }

  const muteBtnString = isMuted ? getString("ARIA__UNMUTE") : getString("ARIA__MUTE");
  setSvgContent(elements.muteBtn, isMuted ? PLUME_SVG.volumeMuted : PLUME_SVG.volumeOn);
  elements.muteBtn.title = muteBtnString;
  elements.muteBtn.ariaLabel = muteBtnString;
  elements.muteBtn.ariaPressed = isMuted.toString();
  elements.muteBtn.classList.toggle("muted", isMuted);
};

const renderPlayPauseButton = (elements: FullscreenElements, isPlaying: boolean): void => {
  if (!elements.playPauseBtn) {
    logger(CPL.ERROR, getString("ERROR__PLAY_PAUSE_BUTTON__NOT_FOUND"));
    return;
  }

  setSvgContent(elements.playPauseBtn, isPlaying ? PLUME_SVG.playPause : PLUME_SVG.playPlay);
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

  const progressFraction = progressPercentage / 100;
  elements.progressSlider.value = `${progressFraction * PROGRESS_SLIDER_GRANULARITY}`;
  elements.progressSlider.style.setProperty("--progress-fraction", progressFraction.toString());

  const { currentTime, duration } = getAppCoreInstance().getState();
  elements.progressSlider.setAttribute(
    "aria-valuetext",
    getString("ARIA__PROGRESS_VALUETEXT", [presentFormattedTime(currentTime), presentFormattedTime(duration)])
  );
};

const renderTrackTitle = (elements: FullscreenElements, trackTitle: string | null): void => {
  if (!elements.headerContainer || !trackTitle) {
    logger(CPL.ERROR, getString("ERROR__HEADER_CONTAINER_OR_TRACK_TITLE__NOT_FOUND"));
    return;
  }

  const trackLink = elements.headerContainer.querySelector(PLUME_ELEM_SELECTORS.headerTrackLink) as HTMLAnchorElement;
  if (trackLink) {
    const bcPlayer = getBcPlayerInstance();
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
  } else {
    logger(CPL.WARN, getString("WARN__TRACK_LINK__NOT_FOUND"));
  }

  const headerTitle = elements.headerContainer.querySelector(PLUME_ELEM_SELECTORS.headerTitle) as HTMLSpanElement;
  if (!headerTitle) {
    logger(CPL.ERROR, getString("ERROR__HEADER_TITLE__NOT_FOUND"));
    return;
  }

  headerTitle.textContent = trackTitle;
  headerTitle.title = trackTitle;
  applyTitleLang(headerTitle, trackTitle);
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
    durationDisplay: clone.querySelector(PLUME_ELEM_SELECTORS.durationDisplay) as HTMLButtonElement,
    speedWrapper: clone.querySelector(PLUME_ELEM_SELECTORS.speedWrapper) as HTMLDivElement,
    speedBtn: clone.querySelector(PLUME_ELEM_SELECTORS.speedBtn) as HTMLButtonElement,
    speedSlider: clone.querySelector(PLUME_ELEM_SELECTORS.speedSlider) as HTMLInputElement,
    trackBackwardBtn: clone.querySelector(PLUME_ELEM_SELECTORS.trackBwdBtn) as HTMLButtonElement,
    timeBackwardBtn: clone.querySelector(PLUME_ELEM_SELECTORS.timeBwdBtn) as HTMLButtonElement,
    playPauseBtn: clone.querySelector(PLUME_ELEM_SELECTORS.playPauseBtn) as HTMLButtonElement,
    timeForwardBtn: clone.querySelector(PLUME_ELEM_SELECTORS.timeFwdBtn) as HTMLButtonElement,
    trackForwardBtn: clone.querySelector(PLUME_ELEM_SELECTORS.trackFwdBtn) as HTMLButtonElement,
    loopBtn: clone.querySelector(PLUME_ELEM_SELECTORS.loopBtn) as HTMLButtonElement,
    muteBtn: clone.querySelector(PLUME_ELEM_SELECTORS.muteBtn) as HTMLButtonElement,
    volumeSlider: clone.querySelector(PLUME_ELEM_SELECTORS.volumeSlider) as HTMLInputElement,
    volumeDisplay: clone.querySelector(PLUME_ELEM_SELECTORS.volumeValue) as HTMLDivElement,
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
  const isAlbumPage = appCore.getState().pageType === "album";

  const subscriptions: Array<SubscriptionCallback> = [];
  const elements: FullscreenElements = getFullscreenElements(clone);

  // Mutable ref for the tracklist cleanup — replaced each time the tracklist is re-initialized live.
  let tracklistCleanupRef: CleanupCallback = () => {};

  const initTracklist = (): void => {
    const { toggleBtn: fsToggleBtn, dropdownEl: fsDropdownEl, cleanup } = createTracklistToggle();
    tracklistCleanupRef = cleanup;
    const inertToggle = clone.querySelector(PLUME_ELEM_SELECTORS.tracklistToggleBtn);
    inertToggle?.replaceWith(fsToggleBtn);
    const inertDropdown = clone.querySelector(PLUME_ELEM_SELECTORS.tracklistDropdown);
    if (inertDropdown) inertDropdown.replaceWith(fsDropdownEl);
    else clone.appendChild(fsDropdownEl);
  };

  // Subscribe to state changes and use pure rendering functions for updates
  subscriptions.push(
    appCore.subscribe("pageType", () => {
      // because available loop modes depend on the page type
      const { featureFlags, loopMode } = appCore.getState();
      if (featureFlags.loopModes) renderLoopButton(elements, loopMode);
    }),
    appCore.subscribe("trackTitle", (trackTitle) => {
      renderTrackTitle(elements, trackTitle);
    }),
    appCore.subscribe("trackNumber", (trackNumber) => {
      renderTrackNumber(elements, trackNumber);
      const { isPlaying, trackBpms } = appCore.getState();
      // Track changed: stop the old BPM loop, then restart if BPM is already known for the new track
      if (vizCanvas) {
        stopVisualizer();
        syncVisualizerWithPlayback(isPlaying, vizCanvas);
      }
      syncBpmDisplay(trackBpms);
    }),
    appCore.subscribe("isPlaying", (isPlaying) => {
      renderPlayPauseButton(elements, isPlaying);
      if (vizCanvas) syncVisualizerWithPlayback(isPlaying, vizCanvas);
    }),
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
    appCore.subscribe("loopMode", (loopMode) => {
      const { featureFlags } = appCore.getState();
      const withLoopModes = featureFlags.loopModes;
      if (withLoopModes) renderLoopButton(elements, loopMode);
    }),
    appCore.subscribe("volume", (volume) => {
      renderVolume(elements, volume);
    }),
    appCore.subscribe("isMuted", (isMuted) => {
      renderMuteButton(elements, isMuted);
    }),
    appCore.subscribe("trackBpms", (trackBpms) => {
      // BPM resolved for some track: update BPM display and (re-)start visualizer if the current track's BPM just became available
      syncBpmDisplay(trackBpms);
      const { isPlaying } = appCore.getState();
      if (vizCanvas) syncVisualizerWithPlayback(isPlaying, vizCanvas);
    }),
    appCore.subscribe("featureFlags", (flags, prevFlags) => {
      if (flags.goToTrack !== prevFlags.goToTrack) {
        const trackLink = elements.headerContainer?.querySelector<HTMLAnchorElement>(
          PLUME_ELEM_SELECTORS.headerTrackLink
        );
        if (trackLink) {
          trackLink.classList.toggle("plume-feature-hidden", !flags.goToTrack);
          if (flags.goToTrack && isAlbumPage) trackLink.style.color = getAppropriateAccentColor();
        }
      }
      if (isAlbumPage && flags.tracklist !== prevFlags.tracklist) {
        if (flags.tracklist) {
          initTracklist();
        } else {
          tracklistCleanupRef();
          tracklistCleanupRef = () => {};
          const btn = clone.querySelector<HTMLElement>(PLUME_ELEM_SELECTORS.tracklistToggleBtn);
          const dd = clone.querySelector<HTMLElement>(PLUME_ELEM_SELECTORS.tracklistDropdown);
          if (btn) btn.classList.add("plume-feature-hidden");
          if (dd) dd.classList.add("plume-feature-hidden");
        }
      }
      if (flags.loopModes && !prevFlags.loopModes) {
        const { loopMode } = appCore.getState();
        renderLoopButton(elements, loopMode);
      }
      if (flags.visualizer !== prevFlags.visualizer && vizCanvas) {
        vizCanvas.classList.toggle("plume-feature-hidden", !flags.visualizer);
        if (flags.visualizer) runVisualizer(vizCanvas);
        else stopVisualizer();
      }
      const fsControls = clone.querySelector<HTMLElement>(PLUME_ELEM_SELECTORS.playbackControls);
      if (fsControls) applyPlaybackControlsSize(fsControls);
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

  // Speed and loop: always wire up regardless of initial flag state.
  // plume-feature-hidden controls visibility; listeners are harmless on hidden elements.
  elements.speedBtn?.addEventListener("click", handleSpeedCycle);
  elements.speedSlider?.addEventListener("input", handleSpeedSlider);
  elements.speedSlider?.addEventListener("keydown", handleSpeedSliderKeydown);
  if (elements.speedWrapper) {
    subscriptions.push(setupSpeedPopoverBehavior(elements.speedWrapper));
    subscriptions.push(setupSpeedLabelClickBehavior(elements.speedWrapper));
  }
  elements.loopBtn?.addEventListener("click", handleLoopCycle);

  const fsBpmDetectAllBtn = clone.querySelector<HTMLButtonElement>(PLUME_ELEM_SELECTORS.bpmDetectAllBtn);
  if (fsBpmDetectAllBtn) wireDetectAllBpmButton(fsBpmDetectAllBtn);

  const flags = appCore.getState().featureFlags;

  const vizCanvas =
    clone
      .closest<HTMLDivElement>(PLUME_ELEM_SELECTORS.fullscreenOverlay)
      ?.querySelector<HTMLCanvasElement>(PLUME_ELEM_SELECTORS.visualizerCanvas) ?? null;
  if (vizCanvas) syncVisualizerWithPlayback(appCore.getState().isPlaying, vizCanvas);

  // Initialize fullscreen UI with current state using the same rendering functions
  const appState = appCore.getState();

  // Clone child nodes from controlled element instead of innerHTML
  elements.headerContainer.textContent = "";
  Array.from(plume.titleDisplay.childNodes).forEach((node) => {
    elements.headerContainer.appendChild(node.cloneNode(true));
  });

  // Apply the Bandcamp theme color to the track link in the fullscreen clone
  if (flags.goToTrack && isAlbumPage) {
    const fsTrackLink = elements.headerContainer.querySelector(
      PLUME_ELEM_SELECTORS.headerTrackLink
    ) as HTMLAnchorElement;
    if (fsTrackLink) fsTrackLink.style.color = getAppropriateAccentColor();
  }

  // Re-initialize the tracklist for the fullscreen clone.
  // cloneNode(true) copies DOM but not event listeners, and the header re-population above adds another
  // inert clone of the toggle button. Replace both inert elements with a fresh instance.
  if (flags.tracklist && isAlbumPage) initTracklist();

  // Apply initial state using pure rendering functions (same logic as subscriptions)
  renderProgressSlider(elements, appCore.computed.progressPercentage());
  renderElapsedDisplay(elements, appCore.computed.formattedElapsed());
  renderDurationDisplay(elements, appCore.computed.formattedDuration());
  renderPlayPauseButton(elements, appState.isPlaying);
  renderVolume(elements, appState.volume);
  renderMuteButton(elements, appState.isMuted);
  renderTrackTitle(elements, appState.trackTitle);
  renderTrackNumber(elements, appState.trackNumber);
  if (flags.loopModes) renderLoopButton(elements, appState.loopMode);

  // Return cleanup function to unsubscribe all listeners
  return () => {
    subscriptions.forEach((unsubscribe) => unsubscribe());
    tracklistCleanupRef();
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
  overlay.role = "dialog";
  overlay.ariaModal = "true";
  overlay.ariaLabel = getString("ARIA__FULLSCREEN_OVERLAY");
  overlay.lang = getActiveLocale();

  // Create background with cover art (blurred and dimmed)
  const background = document.createElement("div");
  background.id = PLUME_ELEM_SELECTORS.fullscreenBackground.split("#")[1];
  background.style.backgroundImage = `url("${encodeURI(artworkUrl)}")`;
  overlay.appendChild(background);

  const vizCanvas = document.createElement("canvas");
  vizCanvas.id = PLUME_ELEM_SELECTORS.visualizerCanvas.split("#")[1];
  vizCanvas.ariaHidden = "true";
  const { featureFlags } = getAppCoreInstance().getState();
  if (!featureFlags.visualizer) vizCanvas.classList.add("plume-feature-hidden");
  overlay.appendChild(vizCanvas);

  const contentContainer = document.createElement("div");
  contentContainer.id = PLUME_ELEM_SELECTORS.fullscreenContent.split("#")[1];

  const presentationContainer = document.createElement("div");
  presentationContainer.id = PLUME_ELEM_SELECTORS.fullscreenPresentationContainer.split("#")[1];

  const newNameSection = bcPlayer.getInfoSection();
  if (!newNameSection) {
    logger(CPL.WARN, getString("WARN__INFO_SECTION__NOT_FOUND"));
    return null;
  }

  // Clone returns Node, but we know it's an HTMLDivElement with the same structure as the original
  const adjustedNameSection = newNameSection.cloneNode(true) as HTMLDivElement;

  adjustedNameSection.className = PLUME_ELEM_SELECTORS.fullscreenTitlingContainer.split(".")[1];
  adjustedNameSection.lang = document.documentElement.lang;
  const headTitle = adjustedNameSection.querySelector("h2")!;
  const releaseName = headTitle.textContent?.trim() || "";
  headTitle.id = PLUME_ELEM_SELECTORS.fullscreenTitlingRelease.split("#")[1];
  if (!isAlbumPage) headTitle.textContent = `"${releaseName}"`;
  applyTitleLang(headTitle, releaseName);

  const coverArtImg = document.createElement("img");
  coverArtImg.id = PLUME_ELEM_SELECTORS.fullscreenCoverArt.split("#")[1];
  coverArtImg.src = artworkUrl;
  coverArtImg.alt = releaseName ? getString("ARIA__COVER_ART_FOR", [releaseName]) : getString("ARIA__COVER_ART");
  presentationContainer.appendChild(coverArtImg);

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
  const logoSvg = createSafeSvgElement(PLUME_SVG.logo);
  if (logoSvg) fullscreenLogo.appendChild(logoSvg);
  const versionTag = document.createElement("p");
  versionTag.id = `${fullscreenLogo.id}__version`;
  versionTag.textContent = APP_VERSION;
  fullscreenLogo.appendChild(versionTag);
  fullscreenLogo.href = PLUME_LINKTREE_URL;
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
  setSvgContent(exitBtn, PLUME_SVG.fullscreenExit);
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
    announceFullscreenState("ARIA__FULLSCREEN__EXITED");
    logger(CPL.INFO, getString("INFO__FULLSCREEN__EXITED"));
    return;
  }

  // Enter fullscreen - dispatch state change first, then build DOM
  const isAlbumPage = appCore.getState().pageType === "album";
  const overlay = buildFullscreenOverlay(isAlbumPage);
  if (!overlay) {
    appCore.dispatch(coreActions.setIsFullscreen(false));
    createToast({
      label: getString("META__TOAST__FULLSCREEN_UNAVAILABLE"),
      title: getString("LABEL__TOAST__FULLSCREEN_UNAVAILABLE__TITLE"),
      description: getString("LABEL__TOAST__FULLSCREEN_UNAVAILABLE__DESCRIPTION"),
      borderType: "warning",
    });
    return;
  }

  const plumeClone = overlay.querySelector(`#${PLUME_ELEM_SELECTORS.fullscreenClone.split("#")[1]}`) as HTMLDivElement;
  fullscreenCleanupCallback = setupFullscreenUi(plumeClone);

  // Register the fullscreen buttons in the store alongside the main-panel buttons.
  // Always register speed/loop elements (even when their flags are off) so the featureFlags
  // subscription in store-subscriptions.ts can toggle their visibility via the store arrays.
  const fsElements = getFullscreenElements(plumeClone);
  if (fsElements.speedWrapper) {
    plumeUi.dispatch(guiActions.setSpeedBtns([...plume.speedBtns, fsElements.speedWrapper]));
  }
  plumeUi.dispatch(guiActions.setPlayPauseBtns([...plume.playPauseBtns, fsElements.playPauseBtn]));
  plumeUi.dispatch(guiActions.setTrackFwdBtns([...plume.trackFwdBtns, fsElements.trackForwardBtn]));
  if (fsElements.loopBtn) {
    plumeUi.dispatch(guiActions.setLoopBtns([...plume.loopBtns, fsElements.loopBtn]));
  }

  // Mount overlay to DOM and record it in the store
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
  setupFullscreenFocusTrap(overlay);

  // Initialize BPM display in the freshly mounted overlay (querySelectorAll now reaches the clone)
  syncBpmDisplay(appCore.getState().trackBpms);

  plumeUi.dispatch(guiActions.setFullscreenOverlay(overlay));
  appCore.dispatch(coreActions.setIsFullscreen(true));

  announceFullscreenState("ARIA__FULLSCREEN__ENTERED");
  logger(CPL.INFO, getString("INFO__FULLSCREEN__ENTERED"));
};
