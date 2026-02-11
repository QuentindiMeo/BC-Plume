// Plume - TypeScript for song page and album page display
import { APP_NAME, APP_VERSION, PLUME_CONSTANTS, PLUME_DEF, PLUME_KO_FI_URL } from "./constants";
import { PLUME_SVG } from "./svg/icons";
import {
  BC_ELEM_IDENTIFIERS,
  DebugControl,
  LocalStorage,
  PLUME_CACHE_KEYS,
  PLUME_ELEM_IDENTIFIERS,
  PlumeCore,
  TIME_DISPLAY_METHOD,
  TimeDisplayMethodType,
} from "./types";
import { browserCache } from "./utils/browser";
import { getString } from "./utils/i18n";
import { CPL, logger } from "./utils/logger";

const browserCacheExists = browserCache !== undefined;

(() => {
  "use strict";

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

  const loadSavedVolume = (): Promise<number> => {
    return new Promise((resolve) => {
      if (browserCacheExists) {
        browserCache
          .get([PLUME_CACHE_KEYS.VOLUME])
          .then((ls: LocalStorage) => {
            let volume = ls[PLUME_CACHE_KEYS.VOLUME] || PLUME_DEF.savedVolume;
            // Validate volume is a valid number within 0-1 range
            if (typeof volume !== "number" || Number.isNaN(volume) || volume < 0 || volume > 1) {
              logger(CPL.WARN, getString("WARN__VOLUME__INVALID_VALUE"), volume);
              volume = PLUME_DEF.savedVolume;
            }
            plume.savedVolume = volume;
            resolve(volume);
          })
          .catch((e) => {
            logger(CPL.WARN, getString("WARN__VOLUME__NOT_LOADED"), e);
            plume.savedVolume = PLUME_DEF.savedVolume;
            resolve(PLUME_DEF.savedVolume);
          });
      } else {
        // Fallback to localStorage
        try {
          const storedVolume = localStorage.getItem(PLUME_CACHE_KEYS.VOLUME);
          let volume = storedVolume ? Number.parseFloat(storedVolume) : PLUME_DEF.savedVolume;
          // Validate volume is a valid number within 0-1 range
          if (Number.isNaN(volume) || volume < 0 || volume > 1) {
            logger(CPL.WARN, getString("WARN__VOLUME__INVALID_VALUE"), volume);
            volume = PLUME_DEF.savedVolume;
          }
          plume.savedVolume = volume;
          resolve(volume);
        } catch (e) {
          logger(CPL.WARN, getString("WARN__VOLUME__NOT_LOADED"), e);
          plume.savedVolume = 1;
          resolve(1);
        }
      }
    });
  };

  // Function to find the audio element
  const findAudioElement = async (): Promise<HTMLAudioElement | null> => {
    const audio = document.querySelector(BC_ELEM_IDENTIFIERS.audioPlayer) as HTMLAudioElement;
    if (!audio) return null;
    logger(CPL.INFO, getString("INFO__AUDIO__FOUND"), audio);

    // Load and immediately apply saved volume
    await loadSavedVolume();
    audio.volume = plume.savedVolume;
    logger(
      CPL.INFO,
      `${getString("INFO__VOLUME__FOUND")} ${Math.round(plume.savedVolume * 100)}${getString("META__PERCENTAGE")}`
    );

    return audio;
  };

  const runtimeInfo = {
    totalRuntime: 0,
    formattedTotalRuntime: "",
    ariaString: "",
    calculated: false,
  };
  const getInfoSectionWithRuntime = (): HTMLDivElement => {
    if (!runtimeInfo.calculated) {
      const trackList = document.querySelector(BC_ELEM_IDENTIFIERS.trackList) as HTMLTableElement;
      if (!trackList) {
        logger(CPL.WARN, getString("WARN__TRACK_LIST__NOT_FOUND"));
        const errorDiv = document.createElement("div");
        errorDiv.textContent = getString("WARN__RUNTIME__NOT_CALCULATED");
        return errorDiv;
      }

      const trackRows = trackList?.querySelectorAll(BC_ELEM_IDENTIFIERS.trackRow) ?? [];
      trackRows.forEach((row, idx) => {
        const durationCell = row.querySelector(BC_ELEM_IDENTIFIERS.trackDuration) as HTMLSpanElement;
        if (!durationCell) {
          logger(CPL.WARN, getString("WARN__DURATION_CELL__NOT_FOUND"), [row, idx]);
          return;
        }

        const durationText = durationCell.textContent.trim();
        const parts = durationText.split(":").map((part) => Number.parseInt(part, 10));
        let seconds = 0;
        if (parts.length === 2) {
          // MM:SS
          seconds = parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
          // HH:MM:SS
          seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        runtimeInfo.totalRuntime += seconds;
      });
      const minutes = Math.floor(runtimeInfo.totalRuntime / 60);
      const seconds = runtimeInfo.totalRuntime % 60;
      runtimeInfo.formattedTotalRuntime = getString("LABEL__RUNTIME", [
        minutes,
        seconds < 10 ? "0" + seconds : seconds.toString(),
      ]);
      runtimeInfo.ariaString = getString("ARIA__RUNTIME__LABEL", [
        Math.floor(runtimeInfo.totalRuntime / 60),
        runtimeInfo.totalRuntime % 60,
      ]);
      logger(CPL.INFO, getString("INFO__RUNTIME__CALCULATED"), runtimeInfo.formattedTotalRuntime);

      runtimeInfo.calculated = true;
    }

    const infoSectionId = BC_ELEM_IDENTIFIERS.infoSection.split("#")[1];
    const infoSection = document.getElementById(infoSectionId) as HTMLDivElement;
    const titleHeadingClone = infoSection.querySelector("h2")!.cloneNode(true);
    const artistHeadingClone = infoSection.querySelector("h3")!.cloneNode(true);

    const newNameSection = document.createElement("div");
    newNameSection.id = infoSectionId;

    const newTitleHeading = document.createElement("div");
    newTitleHeading.className = infoSectionId + "__titling";
    newTitleHeading.appendChild(titleHeadingClone);

    const mainSectionBackground = document.getElementById("pgBd")!;
    const bgColor = globalThis.getComputedStyle(mainSectionBackground).getPropertyValue("background");
    const bgColorAsRGB = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(bgColor);
    const r = Number.parseInt(bgColorAsRGB![1], 10);
    const g = Number.parseInt(bgColorAsRGB![2], 10);
    const b = Number.parseInt(bgColorAsRGB![3], 10);
    const runtimeTextColor = measureContrastRatioWCAG([r, g, b]) >= 3 ? "#0000007f" : "#ffffff7f";

    const runtimeSpan = document.createElement("span");
    runtimeSpan.className = "runtime";
    runtimeSpan.textContent = "(" + runtimeInfo.formattedTotalRuntime + ")";
    runtimeSpan.style.color = runtimeTextColor;
    runtimeSpan.ariaLabel = runtimeInfo.ariaString;
    newTitleHeading.appendChild(runtimeSpan);

    newNameSection.appendChild(newTitleHeading);
    newNameSection.appendChild(artistHeadingClone);
    infoSection.remove();

    return newNameSection;
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

  const setupFullscreenControlSync = (original: HTMLElement, clone: HTMLElement) => {
    const cloneHeaderContainer = clone.querySelector(PLUME_ELEM_IDENTIFIERS.headerContainer) as HTMLDivElement;
    const headerContainerObserver = new MutationObserver(() => {
      // Safe use of innerHTML to clone DOM content from controlled element
      cloneHeaderContainer.innerHTML = plume.titleDisplay!.innerHTML;
    });
    headerContainerObserver.observe(plume.titleDisplay!, { childList: true, subtree: true });

    const cloneProgressSlider = clone.querySelector(PLUME_ELEM_IDENTIFIERS.progressSlider) as HTMLInputElement;
    const progressSliderObserver = new MutationObserver(() => {
      cloneProgressSlider.value = plume.progressSlider!.value;
      cloneProgressSlider.style.backgroundImage = plume.progressSlider!.style.backgroundImage;
    });
    progressSliderObserver.observe(plume.progressSlider!, { attributes: true, attributeFilter: ["value", "style"] });
    cloneProgressSlider.addEventListener("input", function (this: HTMLInputElement) {
      const originalSlider = original.querySelector(PLUME_ELEM_IDENTIFIERS.progressSlider) as HTMLInputElement;
      originalSlider.value = this.value;
      originalSlider.dispatchEvent(new Event("input"));

      const elapsed = plume.audioElement!.currentTime;
      const duration = plume.audioElement!.duration;

      if (!Number.isNaN(duration) && duration > 0) {
        const percent = (elapsed / duration) * 100;
        const bgPercent = percent < 50 ? percent + 1 : percent - 1; // or else it under/overflows
        const bgImg = `linear-gradient(90deg, var(--progbar-fill-bg-left) ${bgPercent.toFixed(1)}%, var(--progbar-bg) 0%)`;
        cloneProgressSlider.value = `${percent * (PROGRESS_SLIDER_GRANULARITY / 100)}`;
        cloneProgressSlider.style.backgroundImage = bgImg;
      }
    });

    const cloneElapsedDisplay = clone.querySelector(PLUME_ELEM_IDENTIFIERS.elapsedDisplay) as HTMLSpanElement;
    const elapsedObserver = new MutationObserver(() => {
      cloneElapsedDisplay.textContent = plume.elapsedDisplay!.textContent;
    });
    elapsedObserver.observe(plume.elapsedDisplay!, { childList: true, subtree: true });

    const cloneDurationDisplay = clone.querySelector(PLUME_ELEM_IDENTIFIERS.durationDisplay) as HTMLSpanElement;
    const durationObserver = new MutationObserver(() => {
      cloneDurationDisplay.textContent = plume.durationDisplay!.textContent;
    });
    durationObserver.observe(plume.durationDisplay!, { childList: true, subtree: true });
    cloneDurationDisplay.addEventListener("click", handleDurationChange);

    const cloneTrackBackwardBtn = clone.querySelector(PLUME_ELEM_IDENTIFIERS.trackBwdBtn) as HTMLButtonElement;
    cloneTrackBackwardBtn.addEventListener("click", handleTrackBackward);

    const cloneTimeBackwardBtn = clone.querySelector(PLUME_ELEM_IDENTIFIERS.timeBwdBtn) as HTMLButtonElement;
    cloneTimeBackwardBtn.addEventListener("click", handleTimeBackward);

    const originalPlayPauseBtn = original.querySelector(PLUME_ELEM_IDENTIFIERS.playPauseBtn) as HTMLButtonElement;
    const clonePlayPauseBtn = clone.querySelector(PLUME_ELEM_IDENTIFIERS.playPauseBtn) as HTMLButtonElement;
    clonePlayPauseBtn.addEventListener("click", () => {
      handlePlayPause([clonePlayPauseBtn, originalPlayPauseBtn]);
    });

    const cloneTimeForwardBtn = clone.querySelector(PLUME_ELEM_IDENTIFIERS.timeFwdBtn) as HTMLButtonElement;
    cloneTimeForwardBtn.addEventListener("click", handleTimeForward);

    const cloneTrackForwardBtn = clone.querySelector(PLUME_ELEM_IDENTIFIERS.trackFwdBtn) as HTMLButtonElement;
    cloneTrackForwardBtn.addEventListener("click", handleTrackForward);

    const cloneVolumeSlider = clone.querySelector(PLUME_ELEM_IDENTIFIERS.volumeSlider) as HTMLInputElement;
    cloneVolumeSlider.addEventListener("input", function (this: HTMLInputElement) {
      const newVolume = Number.parseInt(this.value) / VOLUME_SLIDER_GRANULARITY;
      plume.audioElement!.volume = newVolume;
      saveNewVolume(newVolume);

      // Update the volume display in fullscreen
      const cloneVolumeDisplay = clone.querySelector(PLUME_ELEM_IDENTIFIERS.volumeValue) as HTMLDivElement;
      cloneVolumeDisplay.textContent = `${this.value}${getString("META__PERCENTAGE")}`;
    });

    const cloneMuteBtn = clone.querySelector(PLUME_ELEM_IDENTIFIERS.muteBtn) as HTMLButtonElement;
    cloneMuteBtn.addEventListener("click", () => plume.muteBtn?.click());

    // Sync mute button visual state from original to clone
    const muteBtnObserver = new MutationObserver(() => {
      if (!plume.muteBtn) return;
      // Safe use of innerHTML to clone SVG icon from controlled element
      cloneMuteBtn.innerHTML = plume.muteBtn.innerHTML;
      cloneMuteBtn.ariaLabel = plume.muteBtn.ariaLabel;
      cloneMuteBtn.title = plume.muteBtn.title;
      cloneMuteBtn.className = plume.muteBtn.className;
    });
    muteBtnObserver.observe(plume.muteBtn!, {
      childList: true,
      attributes: true,
      attributeFilter: ["aria-label", "title", "class"],
    });

    // Return cleanup function to disconnect all observers
    return () => {
      headerContainerObserver.disconnect();
      progressSliderObserver.disconnect();
      elapsedObserver.disconnect();
      durationObserver.disconnect();
      muteBtnObserver.disconnect();
    };
  };

  const fullscreenBtnId = PLUME_ELEM_IDENTIFIERS.fullscreenBtnLabel.split("#")[1];
  const fullscreenBtnLabel = getString("LABEL__FULLSCREEN_TOGGLE");
  let fullscreenCleanupCallback: (() => void) | null = null;
  const toggleFullscreenMode = () => {
    const existingOverlay = document.querySelector(PLUME_ELEM_IDENTIFIERS.fullscreenOverlay) as HTMLDivElement;
    const alreadyHasFullscreenOverlay = !!existingOverlay;

    if (alreadyHasFullscreenOverlay) {
      existingOverlay.remove();
      document.body.style.overflow = "auto";

      // Cleanup observers
      fullscreenCleanupCallback?.();
      fullscreenCleanupCallback = null;

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
    exitBtn.addEventListener("click", () => {
      toggleFullscreenMode();
    });
    overlay.appendChild(exitBtn);

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
        const lastFocusable = focusableElements[focusableElements.length - 1];
        const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable || currentIndex === -1) {
            e.preventDefault();
            lastFocusable.focus();
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
      }, 0); // Somehow needs timeout to function right
    };

    overlay.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.code === "Escape") toggleFullscreenMode();
    });

    // Sync all controls with the original plume module
    fullscreenCleanupCallback = setupFullscreenControlSync(plumeContainer, plumeClone);

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    setupFullscreenFocusTrap();

    logger(CPL.INFO, getString("INFO__FULLSCREEN__ENTERED"));
  };

  const createFullscreenBtnContainer = (): HTMLDivElement => {
    const fullscreenBtn: HTMLButtonElement = document.createElement("button");
    fullscreenBtn.id = PLUME_ELEM_IDENTIFIERS.fullscreenBtn.split("#")[1];
    fullscreenBtn.type = "button";
    fullscreenBtn.innerHTML = `<span id="${fullscreenBtnId}">${fullscreenBtnLabel}</span>${PLUME_SVG.fullscreen}`;
    fullscreenBtn.ariaLabel = fullscreenBtnLabel;
    fullscreenBtn.addEventListener("click", () => {
      toggleFullscreenMode();
    });

    const container: HTMLDivElement = document.createElement("div");
    container.id = PLUME_ELEM_IDENTIFIERS.fullscreenBtnContainer.split("#")[1];
    container.appendChild(fullscreenBtn);

    return container;
  };

  // Function to save the new volume from the slider to browser cache
  const saveNewVolume = (newVolume: number) => {
    plume.savedVolume = newVolume;

    if (browserCacheExists) {
      browserCache.set({ [PLUME_CACHE_KEYS.VOLUME]: newVolume });
    } else {
      // Fallback to localStorage
      try {
        localStorage.setItem(PLUME_CACHE_KEYS.VOLUME, newVolume.toString());
      } catch (e) {
        logger(CPL.WARN, getString("WARN__VOLUME__NOT_SAVED"), e);
      }
    }
  };

  // Sync mute button icon and aria-label to reflect the current audio volume state
  const syncMuteBtn = (isMuted: boolean) => {
    if (!plume.muteBtn) return;
    plume.muteBtn.innerHTML = isMuted ? PLUME_SVG.volumeMuted : PLUME_SVG.volumeOn;
    plume.muteBtn.title = isMuted ? getString("ARIA__UNMUTE") : getString("ARIA__MUTE");
    plume.muteBtn.ariaLabel = isMuted ? getString("ARIA__UNMUTE") : getString("ARIA__MUTE");
    plume.muteBtn.ariaPressed = isMuted.toString();
    plume.muteBtn.classList.toggle("muted", isMuted);
  };

  const VOLUME_SLIDER_GRANULARITY = 100;
  // Function to create the volume slider
  const createVolumeSlider = async (): Promise<HTMLDivElement | null> => {
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
    volumeSlider.value = Math.round(plume.savedVolume * VOLUME_SLIDER_GRANULARITY).toString();
    volumeSlider.ariaLabel = getString("ARIA__VOLUME_SLIDER");

    // Apply saved volume to audio element
    plume.audioElement!.volume = plume.savedVolume;

    const valueDisplay = document.createElement("div");
    valueDisplay.id = PLUME_ELEM_IDENTIFIERS.volumeValue.split("#")[1];
    valueDisplay.textContent = `${volumeSlider.value}${getString("META__PERCENTAGE")}`;

    muteBtn.addEventListener("click", () => {
      if (!plume.audioElement) {
        logger(CPL.WARN, getString("WARN__AUDIO__NOT_FOUND"));
        return;
      }

      const currentlyMuted = plume.audioElement.volume === 0;
      if (currentlyMuted) {
        const restoredVolume = plume.playerVolume > 0 ? plume.playerVolume : PLUME_DEF.savedVolume;
        plume.audioElement.volume = restoredVolume;
        volumeSlider.value = Math.round(restoredVolume * VOLUME_SLIDER_GRANULARITY).toString();
        valueDisplay.textContent = `${volumeSlider.value}${getString("META__PERCENTAGE")}`;
        syncMuteBtn(false);
      } else {
        plume.playerVolume = plume.audioElement.volume;
        plume.audioElement.volume = 0;
        volumeSlider.value = "0";
        valueDisplay.textContent = `0${getString("META__PERCENTAGE")}`;
        syncMuteBtn(true);
      }
    });

    // Event listener for volume change via slider
    volumeSlider.addEventListener("input", function (this: HTMLInputElement) {
      const volume = Number.parseInt(this.value) / VOLUME_SLIDER_GRANULARITY;

      if (!plume.audioElement) {
        logger(CPL.WARN, getString("WARN__AUDIO__NOT_FOUND"));
        return;
      }

      plume.audioElement.volume = volume;
      valueDisplay.textContent = `${this.value}${getString("META__PERCENTAGE")}`;

      // Moving slider off zero counts as an intentional unmute
      if (volume > 0) syncMuteBtn(false);

      saveNewVolume(volume);
    });

    container.appendChild(muteBtn);
    container.appendChild(volumeSlider);
    container.appendChild(valueDisplay);

    plume.volumeSlider = volumeSlider;
    plume.muteBtn = muteBtn;
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
    const prevButton = document.querySelector(BC_ELEM_IDENTIFIERS.previousTrack) as HTMLButtonElement;
    if (!prevButton) {
      logger(CPL.WARN, getString("WARN__PREV_TRACK__NOT_FOUND"));
      return null;
    }

    const firstTrackIsPlaying = !isAlbumPage || isFirstTrackOfAlbumPlaying();
    if (plume.audioElement!.currentTime < PLUME_CONSTANTS.TIME_BEFORE_RESTART && !firstTrackIsPlaying) {
      prevButton.click();
    } else {
      // Restart current track instead, if more than X seconds have elapsed
      plume.audioElement!.currentTime = 0;
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
    playPauseBtn.innerHTML = plume.audioElement!.paused ? PLUME_SVG.playPlay : PLUME_SVG.playPause;
    playPauseBtn.title = getString("LABEL__PLAY_PAUSE");
    playPauseBtn.addEventListener("click", () => {
      handlePlayPause([playPauseBtn]);
    });

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
    logger(CPL.DEBUG, getString("DEBUG__REWIND_TIME__CLICKED"));

    const newTime = Math.max(0, plume.audioElement!.currentTime - TIME_STEP_DURATION);
    plume.audioElement!.currentTime = newTime;
    if (plume.audioElement!.paused)
      setTimeout(() => {
        plume.audioElement!.pause(); // prevent auto-play when rewinding on paused track
      }, 10);

    logger(
      CPL.DEBUG,
      `${getString("DEBUG__REWIND_TIME__DISPATCHED1")} ${Math.round(newTime)}${getString(
        "DEBUG__REWIND_TIME__DISPATCHED2"
      )}`
    );
  };

  const handlePlayPause = (playPauseBtns: HTMLButtonElement[]) => {
    if (plume.audioElement!.paused) {
      plume.audioElement!.play();
      playPauseBtns.forEach((btn) => (btn.innerHTML = PLUME_SVG.playPause));
    } else {
      plume.audioElement!.pause();
      playPauseBtns.forEach((btn) => (btn.innerHTML = PLUME_SVG.playPlay));
    }
  };

  const handleTimeForward = () => {
    logger(CPL.DEBUG, getString("DEBUG__FORWARD_TIME__CLICKED"));

    const newTime = Math.min(plume.audioElement!.duration || 0, plume.audioElement!.currentTime + TIME_STEP_DURATION);
    plume.audioElement!.currentTime = newTime;
    if (plume.audioElement!.paused)
      setTimeout(() => {
        plume.audioElement!.pause(); // prevent auto-play when forwarding on paused track
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

  // Function to format time as MM:SS
  const formatTime = (seconds: number): string => {
    if (Number.isNaN(seconds) || !Number.isFinite(seconds)) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const saveDurationDisplayMethod = (newMethod: TimeDisplayMethodType) => {
    plume.durationDisplayMethod = newMethod;

    const player = plume.audioElement;
    if (!player || !plume.durationDisplay || !plume.elapsedDisplay) return;
    if (plume.durationDisplayMethod === TIME_DISPLAY_METHOD.DURATION) {
      plume.durationDisplay.textContent = formatTime(player.duration);
    } else {
      plume.durationDisplay.textContent = "-" + formatTime(player.duration - player.currentTime);
    }

    if (browserCacheExists) {
      browserCache.set({ [PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD]: newMethod });
    } else {
      // Fallback to localStorage
      try {
        localStorage.setItem(PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD, newMethod);
      } catch (e) {
        logger(CPL.WARN, getString("WARN__VOLUME__NOT_SAVED"), e);
      }
    }
  };

  const PROGRESS_SLIDER_GRANULARITY = 1000; // use 1000 for better granularity: 1000s = 16m40s
  const createProgressContainer = async () => {
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
      if (plume.audioElement) plume.audioElement.currentTime = progress * (plume.audioElement.duration || 0);
      if (plume.audioElement!.paused)
        setTimeout(() => {
          plume.audioElement!.pause(); // prevent auto-play when seeking on paused track
        }, 10);
    });

    plume.progressSlider = progressSlider;
    plume.elapsedDisplay = elapsed;
    plume.durationDisplay = duration;

    return container;
  };

  const handleDurationChange = () => {
    if (plume.durationDisplay && plume.audioElement) {
      saveDurationDisplayMethod(
        plume.durationDisplayMethod === TIME_DISPLAY_METHOD.DURATION
          ? TIME_DISPLAY_METHOD.REMAINING
          : TIME_DISPLAY_METHOD.DURATION
      );
    }
  };

  const RGBToHSL = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let [h, s, l] = [0, 0, (max + min) / 2];

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return [h * 360, s * 100, l * 100];
  };
  const isGrayscale = (rgb: [number, number, number]): boolean => RGBToHSL(...rgb)[1] === 0;
  const getLuminance = (rgb: [number, number, number]): number => {
    const [r, g, b] = rgb.map((c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const measureContrastRatioWCAG = (rgb: [number, number, number]): number => {
    const bgRgb: [number, number, number] = [18, 18, 18];

    const L1 = getLuminance(rgb);
    const L2 = getLuminance(bgRgb);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  };

  const CONTRAST_ADJUSTMENT_STEP = 0.05;
  const adjustColorContrast = (rgb: [number, number, number], minContrast: number): string => {
    let current = [...rgb] as [number, number, number];
    let factor = 0;
    while (measureContrastRatioWCAG(current) < minContrast && factor < 1) {
      factor += CONTRAST_ADJUSTMENT_STEP;
      current = current.map((c) => Math.round(c + (255 - c) * factor)) as [number, number, number];
    }

    // return as rgb(r, g, b)
    return `rgb(${current.map((c) => Math.round(c)).join(", ")})`;
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

  const WCAG_CONTRAST = 4.5; // "The visual presentation of text [must have] a contrast ratio of at least 4.5:1"
  const FALLBACK_GRAY_RGB_STR = "rgb(127, 127, 127)"; // fallback gray if the best color is grayscale, to ensure visibility on Plume's dark background
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
    if (trackColorContrast > WCAG_CONTRAST && artistColorContrast > WCAG_CONTRAST) {
      const trackColorSaturation = RGBToHSL(...trackColorRGB)[1];
      const artistColorSaturation = RGBToHSL(...artistColorRGB)[1];
      return trackColorSaturation > artistColorSaturation ? trackColor : artistColor;
    } else if (trackColorContrast > WCAG_CONTRAST || artistColorContrast > WCAG_CONTRAST) {
      return trackColorContrast > WCAG_CONTRAST ? trackColor : artistColor;
    } else {
      const preferredColor = trackColorContrast > artistColorContrast ? trackColor : artistColor;
      const preferredColorMatch = preferredColor.match(/\d+/g);
      if (!preferredColorMatch) {
        return FALLBACK_GRAY_RGB_STR;
      }
      const preferredColorRgb = preferredColorMatch.map(Number) as [number, number, number];
      if (isGrayscale(preferredColorRgb)) return FALLBACK_GRAY_RGB_STR;
      return adjustColorContrast(preferredColorRgb, WCAG_CONTRAST);
    }
  };

  interface TrackQuantifiers {
    current: number;
    total: number;
  }
  // Function to get the current track quantifiers (e.g. 3rd out of 10)
  const getTrackQuantifiers = (trackName: string): TrackQuantifiers => {
    const trackTable = document.querySelector(BC_ELEM_IDENTIFIERS.trackList) as HTMLTableElement;
    if (!trackTable) return { current: 0, total: 0 };

    const trackRows = trackTable.querySelectorAll(BC_ELEM_IDENTIFIERS.trackRow);
    if (trackRows.length === 0) return { current: 0, total: 0 };

    const trackRowTitles = Array.from(trackTable.querySelectorAll(BC_ELEM_IDENTIFIERS.trackTitle));
    const currentTrackNumber = trackRowTitles.findIndex((el) => el.textContent === trackName) + 1;
    logger(CPL.DEBUG, getString("DEBUG__TRACK__QUANTIFIERS", [currentTrackNumber, trackRows.length]));
    return { current: currentTrackNumber, total: trackRows.length };
  };

  // Function to get the current track title from Bandcamp
  const getCurrentTrackTitle = (): string => {
    const titleElement = isAlbumPage
      ? (document.querySelector(BC_ELEM_IDENTIFIERS.albumPageCurrentTrackTitle) as HTMLSpanElement)
      : (document.querySelector(BC_ELEM_IDENTIFIERS.songPageCurrentTrackTitle) as HTMLSpanElement);
    if (!titleElement?.textContent) return getString("LABEL__TRACK_UNKNOWN");

    return titleElement.textContent.trim();
  };

  // Function to hide original Bandcamp player elements
  const hideOriginalPlayerElements = () => {
    const bcAudioTable = document.querySelector(BC_ELEM_IDENTIFIERS.inlinePlayerTable) as HTMLTableElement;
    if (bcAudioTable) {
      bcAudioTable.style.display = "none";
      bcAudioTable.classList.add(PLUME_ELEM_IDENTIFIERS.bcElements.split("#")[1]);
    }

    logger(CPL.LOG, getString("LOG__ORIGINAL_PLAYER__HIDDEN"));
  };

  // Function to restore original player elements (use it for debug purposes)
  const restoreOriginalPlayerElements = () => {
    const bcAudioTable = document.querySelector(PLUME_ELEM_IDENTIFIERS.bcElements) as HTMLTableElement;
    if (!bcAudioTable) return; // eliminate onInit function call

    bcAudioTable.style.display = "unset";
    bcAudioTable.classList.remove(PLUME_ELEM_IDENTIFIERS.bcElements.split("#")[1]);

    logger(CPL.LOG, getString("LOG__ORIGINAL_PLAYER__RESTORED"));
  };

  // Function to find the original Bandcamp player container
  const findOriginalPlayerContainer = (): HTMLDivElement | null => {
    const BC_PLAYER_SELECTORS = [
      ".inline_player",
      "#trackInfoInner",
      ".track_play_auxiliary",
      ".track_play_hilite",
      ".track_play_area",
    ];

    let playerContainer = null;
    for (const selector of BC_PLAYER_SELECTORS) {
      playerContainer = document.querySelector(selector);
      if (playerContainer) break; // found the original player container!
    }

    if (!playerContainer) {
      logger(CPL.WARN, getString("WARN__PLAYER_CONTAINER_NOT_FOUND"));
      // Search near audio elements
      if (plume.audioElement) {
        playerContainer = plume.audioElement.closest("div") || plume.audioElement.parentElement;
      }
    }

    return playerContainer ? (playerContainer as HTMLDivElement) : null;
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
    currentTitlePretext.textContent = isAlbumPage
      ? getString("LABEL__TRACK_CURRENT", `${initialTq.current}/${initialTq.total}`)
      : getString("LABEL__TRACK");
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

    plume.titleDisplay = headerContainer;
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

    const fullscreenBtnContainer = createFullscreenBtnContainer();
    plumeContainer.appendChild(fullscreenBtnContainer);

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
    const preText = plume.titleDisplay?.querySelector(PLUME_ELEM_IDENTIFIERS.headerTitlePretext) as HTMLSpanElement;
    if (!preText) return;

    const newTrackTitle = getCurrentTrackTitle();
    const newTq = getTrackQuantifiers(newTrackTitle);
    preText.textContent = isAlbumPage
      ? getString("LABEL__TRACK_CURRENT", `${newTq.current}/${newTq.total}`)
      : getString("LABEL__TRACK");

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
    const titleText = plume.titleDisplay?.querySelector(PLUME_ELEM_IDENTIFIERS.headerTitle) as HTMLSpanElement;
    if (!titleText) return;

    const newTrackTitle = getCurrentTrackTitle();
    titleText.textContent = newTrackTitle;
    titleText.title = newTrackTitle; // allow the user to see the full title on hover, in case the title is truncated

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
    if (!plume.progressSlider) return;

    const elapsed = plume.audioElement!.currentTime;
    const duration = plume.audioElement!.duration;

    if (!Number.isNaN(duration) && duration > 0) {
      const percent = (elapsed / duration) * 100;
      const bgPercent = percent < 50 ? percent + 1 : percent - 1; // or else it under/overflows
      const bgImg = `linear-gradient(90deg, var(--progbar-fill-bg-left) ${bgPercent.toFixed(1)}%, var(--progbar-bg) 0%)`;
      plume.progressSlider.value = `${percent * (PROGRESS_SLIDER_GRANULARITY / 100)}`;
      plume.progressSlider.style.backgroundImage = bgImg;

      if (plume.elapsedDisplay) {
        plume.elapsedDisplay.textContent = formatTime(elapsed);
      }

      if (plume.durationDisplay) {
        if (plume.durationDisplayMethod === TIME_DISPLAY_METHOD.DURATION) {
          plume.durationDisplay.textContent = formatTime(duration);
        } else {
          plume.durationDisplay.textContent = "-" + formatTime(duration - elapsed);
        }
      }
    }
  };

  // Function to set up event listeners on the audio element: progress, metadata, volume
  const setupAudioListeners = () => {
    // Update progress container
    plume.audioElement!.addEventListener("timeupdate", updateProgressBar);
    plume.audioElement!.addEventListener("loadedmetadata", updateProgressBar);
    plume.audioElement!.addEventListener("durationchange", updateProgressBar);

    // Update title when metadata loads (new track)
    plume.audioElement!.addEventListener("loadedmetadata", updateTitleDisplay);
    plume.audioElement!.addEventListener("loadedmetadata", updatePretextDisplay);
    plume.audioElement!.addEventListener("loadedmetadata", updateTrackForwardBtnState);
    plume.audioElement!.addEventListener("loadstart", updateTitleDisplay);
    plume.audioElement!.addEventListener("loadstart", updatePretextDisplay);
    plume.audioElement!.addEventListener("loadstart", updateTrackForwardBtnState);

    // Sync volume slider and mute button with external volume changes
    plume.audioElement!.addEventListener("volumechange", () => {
      if (!plume.volumeSlider) return;

      const currentVolume = plume.audioElement!.volume;
      plume.volumeSlider.value = `${Math.round(currentVolume * VOLUME_SLIDER_GRANULARITY)}`;
      const valueDisplay = plume.volumeSlider.parentElement!.querySelector(
        PLUME_ELEM_IDENTIFIERS.volumeValue
      ) as HTMLSpanElement;
      if (valueDisplay) {
        valueDisplay.textContent = `${plume.volumeSlider.value}${getString("META__PERCENTAGE")}`;
      }

      syncMuteBtn(currentVolume === 0);
      if (currentVolume !== 0) saveNewVolume(currentVolume);
    });

    logger(CPL.INFO, getString("INFO__AUDIO_EVENT_LISTENERS__SET_UP"));
  };

  let scrollIsTicking = false; // this variable must be outside the function scope to have persistent state
  const SCROLLED_CLASSNAME = "scrolled"; // from `styles.css`
  // Function to create a scroll listener to apply a specific styling to the player when it's out of viewport
  const createPlumeStickinessListener = () => {
    const parentDivClassName = BC_ELEM_IDENTIFIERS.playerParent.split(".")[1];
    const plumeParentDiv = document.getElementsByClassName(parentDivClassName)[0];
    if (!plumeParentDiv) {
      logger(CPL.ERROR, getString("ERROR__PLAYER_PARENT__NOT_FOUND"));
      return;
    }

    const triggerHeight = (plumeParentDiv as HTMLDivElement).offsetTop;
    window.addEventListener("scroll", () => {
      // Check if plume is in viewport height for sticky styling
      if (scrollIsTicking) return;
      scrollIsTicking = true;

      globalThis.requestAnimationFrame(() => {
        const plumeIsInViewport = window.scrollY < triggerHeight;
        if (plumeIsInViewport) {
          plumeParentDiv.classList.remove(SCROLLED_CLASSNAME);
        } else {
          plumeParentDiv.classList.add(SCROLLED_CLASSNAME);
        }
        scrollIsTicking = false;
      });
    });
  };

  // Function to load the duration display method from browser cache (duration or remaining)
  const loadDurationDisplayMethod = (): Promise<TimeDisplayMethodType> => {
    return new Promise((resolve) => {
      if (browserCacheExists) {
        browserCache
          .get([PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD])
          .then((ls: LocalStorage) => {
            const durationDisplayMethod =
              ls[PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD] || PLUME_DEF.durationDisplayMethod;
            plume.durationDisplayMethod = durationDisplayMethod;
            resolve(durationDisplayMethod);
          })
          .catch((e) => {
            logger(CPL.WARN, getString("WARN__TIME_DISPLAY_METHOD__NOT_LOADED"), e);
            plume.durationDisplayMethod = PLUME_DEF.durationDisplayMethod;
            resolve(PLUME_DEF.durationDisplayMethod);
          });
      } else {
        // Fallback to localStorage
        try {
          const storedDurationDisplayMethod = localStorage.getItem(PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD);
          const durationDisplayMethod: TimeDisplayMethodType = storedDurationDisplayMethod
            ? (storedDurationDisplayMethod as TimeDisplayMethodType)
            : TIME_DISPLAY_METHOD.DURATION;
          plume.durationDisplayMethod = durationDisplayMethod;
          resolve(durationDisplayMethod);
        } catch (e) {
          logger(CPL.WARN, getString("WARN__TIME_DISPLAY_METHOD__NOT_LOADED"), e);
          plume.durationDisplayMethod = TIME_DISPLAY_METHOD.DURATION;
          resolve(TIME_DISPLAY_METHOD.DURATION);
        }
      }
    });
  };

  const setupKeyboardShortcuts = () => {
    const handlePlayPauseShortcut = () => {
      const playPauseBtns = Array.from(document.querySelectorAll(PLUME_ELEM_IDENTIFIERS.playPauseBtn));
      handlePlayPause(playPauseBtns as HTMLButtonElement[]);
    };

    const handleAdjustVolume = (delta: number) => {
      if (!plume.volumeSlider || !plume.audioElement) return;

      const currentValue = Number.parseInt(plume.volumeSlider.value);
      const newValue = Math.max(0, Math.min(VOLUME_SLIDER_GRANULARITY, currentValue + delta));
      plume.volumeSlider.value = newValue.toString();

      const volume = newValue / VOLUME_SLIDER_GRANULARITY;
      plume.audioElement.volume = volume;

      const volumeSliders = document.querySelectorAll(PLUME_ELEM_IDENTIFIERS.volumeSlider);
      volumeSliders.forEach((slider) => {
        (slider as HTMLInputElement).value = newValue.toString();

        const valueDisplay = slider.parentElement!.querySelector(PLUME_ELEM_IDENTIFIERS.volumeValue) as HTMLDivElement;
        valueDisplay.textContent = `${newValue}${getString("META__PERCENTAGE")}`;
      });

      saveNewVolume(volume);
    };

    const handleToggleMute = () => {
      if (plume.muteBtn) plume.muteBtn.click();
    };

    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if (!(e.ctrlKey && e.altKey)) return; // require Ctrl + Alt modifier
      const isValidShortcut = PLUME_CONSTANTS.AVAILABLE_SHORTCUT_CODES.has(e.code);
      if (!isValidShortcut) return;

      e.preventDefault();
      e.stopPropagation();
      switch (e.code) {
        case "Space":
          handlePlayPauseShortcut();
          break;
        case "ArrowLeft":
          handleTimeBackward();
          break;
        case "ArrowRight":
          handleTimeForward();
          break;
        case "ArrowUp":
          handleAdjustVolume(5);
          break;
        case "ArrowDown":
          handleAdjustVolume(-5);
          break;
        case "PageUp":
          handleTrackBackward();
          break;
        case "PageDown":
          handleTrackForward();
          break;
        case "KeyF":
          toggleFullscreenMode();
          break;
        case "KeyM":
          handleToggleMute();
          break;
      }
    });

    logger(CPL.INFO, getString("INFO__SHORTCUTS__REGISTERED"));
  };

  // Main initialization function
  let isInitializing = false;
  let isInitialized = false;

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

    plume.audioElement = await findAudioElement();
    if (!plume.audioElement) {
      logger(CPL.WARN, getString("WARN__AUDIO_ELEMENT__NOT_FOUND"));
      isInitializing = false;
      setTimeout(init, 1000); // retry after 1 second
      return;
    }

    const plumeIsAlreadyInjected = !!document.querySelector(PLUME_ELEM_IDENTIFIERS.plumeContainer);
    if (plumeIsAlreadyInjected) {
      isInitializing = false;
      isInitialized = true;
      return;
    }

    // Ensure duration display method is applied
    await loadDurationDisplayMethod();
    logger(CPL.INFO, `${getString("INFO__TIME_DISPLAY_METHOD__APPLIED")} "${plume.durationDisplayMethod}"`);

    // Inject enhancements
    await injectEnhancements();
    setupAudioListeners();
    setupKeyboardShortcuts();
    initPlayback();

    // Debug: show detected controls
    debugBandcampControls();

    logger(CPL.LOG, getString("LOG__INITIALIZATION__COMPLETE"));
    isInitializing = false;
    isInitialized = true;
  };

  const plume: PlumeCore = {
    audioElement: null,
    titleDisplay: null,
    progressSlider: null,
    elapsedDisplay: null,
    durationDisplay: null,
    durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION,
    volumeSlider: null,
    muteBtn: null,
    savedVolume: PLUME_DEF.savedVolume,
    playerVolume: PLUME_DEF.playerVolume,
  };

  // Observe DOM changes for players that load dynamically
  const domObserver = new MutationObserver((mutations) => {
    mutations.forEach(async (mutation) => {
      if (mutation.type === "childList") {
        // Check if a new audio element was added
        const newAudio = document.querySelector(BC_ELEM_IDENTIFIERS.audioPlayer) as HTMLAudioElement;
        if (newAudio && newAudio !== plume.audioElement) {
          logger(CPL.INFO, getString("INFO__NEW_AUDIO__FOUND"));

          // Ensure duration display method is applied
          await loadDurationDisplayMethod();
          logger(CPL.INFO, `${getString("INFO__TIME_DISPLAY_METHOD__APPLIED")} "${plume.durationDisplayMethod}"`);

          // Load and apply saved volume to the new element
          await loadSavedVolume();
          newAudio.volume = plume.savedVolume;
          logger(
            CPL.INFO,
            `${getString("INFO__VOLUME__APPLIED")} ${Math.round(plume.savedVolume * 100)}${getString(
              "META__PERCENTAGE"
            )}`
          );

          plume.audioElement = newAudio;

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
  createPlumeStickinessListener();

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
      existingOverlay.remove();
      document.body.style.overflow = "auto";
      fullscreenCleanupCallback?.();
      fullscreenCleanupCallback = null;
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
    fullscreenCleanupCallback?.();
  });
})();
