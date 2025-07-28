// Plume - TypeScript Content Script

interface AnyBrowserStorageAPI {
  storage: {
    local: {
      get: (keys: Array<string>) => Promise<any>;
      set: (items: any) => Promise<void>;
    };
  };
}
type BrowserAPI = AnyBrowserStorageAPI | null;
type BrowserType = "Chromium" | "Firefox" | "unknown";

/**
 * Audio player enhancement handles
 */
interface PlumeObject {
  audioElement: HTMLAudioElement | null;
  volumeSlider: HTMLInputElement | null;
  progressBar: HTMLDivElement | null;
  progressFill: HTMLDivElement | null;
  progressHandle: HTMLDivElement | null;
  currentTimeDisplay: HTMLSpanElement | null;
  durationDisplay: HTMLSpanElement | null;
  titleDisplay: HTMLDivElement | null;
  isDragging: boolean;
  savedVolume: number;
}

/**
 * Volume storage interface
 */
interface VolumeStorage {
  bandcamp_volume?: number;
}

/**
 * Debug control information
 */
interface DebugControl {
  index: number;
  tagName: string;
  classes: string;
  title: string;
  text: string;
  onclick: string;
}

interface BcProgressEvent {
  clientX: number;
}

enum BC_ELEM_IDENTIFIERS {
  previousTrack = ".prevbutton",
  nextTrack = ".nextbutton",
  playPause = ".playbutton",
  currentTrackTitle = ".title_link",
  audioPlayer = "audio",
}

(() => {
  "use strict";

  // Browser detection and compatible storage API
  const browserAPI: AnyBrowserStorageAPI | null = (() => {
    if (typeof (globalThis as any).chrome !== "undefined" && (globalThis as any).chrome.storage) {
      return (globalThis as any).chrome;
    } else if (typeof (globalThis as any).browser !== "undefined" && (globalThis as any).browser.storage) {
      return (globalThis as any).browser;
    } else {
      console.warn("No browser API detected, using localStorage as fallback");
      return null;
    }
  })();
  const browserLocalStorage = browserAPI?.storage?.local;
  const browserType: BrowserType = (() => {
    if (browserAPI) {
      return typeof (globalThis as any).chrome !== "undefined" ? "Chromium" : "Firefox";
    } else {
      return "unknown";
    }
  })();
  console.info("Detected browser:", browserType);

  const plume: PlumeObject = {
    audioElement: null,
    volumeSlider: null,
    progressBar: null,
    progressFill: null,
    progressHandle: null,
    currentTimeDisplay: null,
    durationDisplay: null,
    titleDisplay: null,
    isDragging: false,
    savedVolume: 1, // Default volume
  };

  const saveNewVolume = (newVolume: number) => {
    plume.savedVolume = newVolume;

    if (browserLocalStorage !== undefined) {
      // Chrome/Firefox with extension API
      browserLocalStorage.set({ bandcamp_volume: newVolume });
    } else {
      // Fallback with localStorage
      try {
        localStorage.setItem("bandcamp_volume", newVolume.toString());
      } catch (e) {
        console.warn("Unable to save volume:", e);
      }
    }
  };

  const loadSavedVolume = (): Promise<number> => {
    return new Promise((resolve) => {
      if (browserLocalStorage !== undefined) {
        // Chrome/Firefox with extension API
        browserLocalStorage.get(["bandcamp_volume"]).then((result: VolumeStorage) => {
          const volume = result.bandcamp_volume || 1; // 1 = 100% by default
          plume.savedVolume = volume;
          resolve(volume);
        });
      } else {
        // Fallback with localStorage
        try {
          const storedVolume = localStorage.getItem("bandcamp_volume");
          const volume = storedVolume ? parseFloat(storedVolume) : 1;
          plume.savedVolume = volume;
          resolve(volume);
        } catch (e) {
          console.warn("Unable to load volume:", e);
          plume.savedVolume = 1;
          resolve(1);
        }
      }
    });
  };

  // Function to format time as MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Function to click on the previous track button
  const clickPreviousTrackButton = () => {
    const prevButton = document.querySelector(BC_ELEM_IDENTIFIERS.previousTrack) as HTMLButtonElement;
    if (prevButton) {
      prevButton.click();
      console.debug("Previous track button clicked");
    } else {
      console.warn("Previous track button not found");
    }
  };

  // Function to click on the next track button
  const clickNextTrackButton = () => {
    const nextButton = document.querySelector(BC_ELEM_IDENTIFIERS.nextTrack) as HTMLButtonElement;
    if (nextButton) {
      nextButton.click();
      console.debug("Next track button clicked");
    } else {
      console.warn("Next track button not found");
    }
  };

  // Function to initialize playback (necessary to make Plume buttons effective)
  const initPlayback = () => {
    const playButton = document.querySelector(BC_ELEM_IDENTIFIERS.playPause) as HTMLButtonElement;
    if (playButton) {
      // Double-click to ensure playback has started
      playButton.click();
      playButton.click();
    } else {
      console.warn("Play button not found");
    }
  };

  // Function to get the current track title from Bandcamp
  const getCurrentTrackTitle = (): string => {
    const titleElement = document.querySelector(BC_ELEM_IDENTIFIERS.currentTrackTitle) as HTMLSpanElement;
    if (titleElement?.textContent) {
      return titleElement.textContent.trim();
    }
    return "Unknown Track";
  };

  // Function to update the title display when track changes
  const updateTitleDisplay = () => {
    if (plume.titleDisplay) {
      const titleText = plume.titleDisplay.querySelector(".bpe-title-text");
      if (titleText) {
        titleText.textContent = getCurrentTrackTitle();
      }
    }
  };

  // Function to find the audio element
  const findAudioElement = async (): Promise<HTMLAudioElement | null> => {
    const audio = document.querySelector(BC_ELEM_IDENTIFIERS.audioPlayer) as HTMLAudioElement;
    if (audio) {
      console.info("Audio element found:", audio);

      // Load and immediately apply saved volume
      await loadSavedVolume();
      audio.volume = plume.savedVolume;
      console.info(`Restored volume: ${Math.round(plume.savedVolume * 100)}%`);

      return audio;
    }
    return null;
  };

  // Function to create the volume slider
  const createVolumeSlider = async (): Promise<HTMLDivElement | null> => {
    if (!plume.audioElement || plume.volumeSlider) return null;

    // Load saved volume
    await loadSavedVolume();

    const container = document.createElement("div");
    container.className = "bpe-volume-container";

    const label = document.createElement("label");
    label.className = "bpe-volume-label";
    label.textContent = "Volume";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = Math.round(plume.savedVolume * 100).toString();
    slider.className = "bpe-volume-slider";

    // Apply saved volume to audio element
    plume.audioElement.volume = plume.savedVolume;

    const valueDisplay = document.createElement("div");
    valueDisplay.className = "bpe-volume-value";
    valueDisplay.textContent = `${slider.value}%`;

    // Event listener for volume change
    slider.addEventListener("input", function (this: HTMLInputElement) {
      const volume = parseInt(this.value) / 100;
      if (plume.audioElement) {
        plume.audioElement.volume = volume;
        valueDisplay.textContent = `${this.value}%`;

        // Save new volume
        saveNewVolume(volume);
      }
    });

    container.appendChild(label);
    container.appendChild(slider);
    container.appendChild(valueDisplay);

    plume.volumeSlider = slider;
    return container;
  };

  const hideOriginalPlayerElements = () => {
    const bcAudioTable = document.querySelector(".inline_player > table") as HTMLTableElement;
    if (bcAudioTable) {
      bcAudioTable.style.display = "none";
      bcAudioTable.classList.add("bpe-hidden-original");
    }

    console.log("Original player elements hidden");
  };

  // Function to restore original player elements (if needed)
  //@ts-ignore This is unused, but kept for debug purposes
  const restoreOriginalPlayerElements = () => {
    const bcAudioTable = document.querySelector(".bpe-hidden-original") as HTMLTableElement;
    bcAudioTable.style.display = "unset";
    bcAudioTable.classList.remove("bpe-hidden-original");

    console.log("Original player elements restored");
  };

  // Debug function to identify Bandcamp controls
  const debugBandcampControls = () => {
    console.debug("=== DEBUG: Detected control elements ===");

    // Find all possible buttons and links
    const allButtons = document.querySelectorAll(
      'button, a, div[role="button"], span[onclick]'
    ) as unknown as Array<HTMLButtonElement>;
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

    console.debug("Potential controls found:", relevantControls);
    console.debug("=== END DEBUG ===");

    return relevantControls;
  };

  const createPlaybackControls = () => {
    const container = document.createElement("div");
    container.className = "bpe-playback-controls";

    const trackBackwardBtn = document.createElement("button");
    trackBackwardBtn.className = "bpe-track-bwd-btn";
    trackBackwardBtn.innerHTML = "👈";
    trackBackwardBtn.title = "Go to previous track";

    const timeBackwardBtn = document.createElement("button");
    timeBackwardBtn.className = "bpe-time-bwd-btn";
    timeBackwardBtn.innerHTML = "⏪";
    timeBackwardBtn.title = "Rewind 10 seconds";

    const playPauseBtn = document.createElement("button");
    playPauseBtn.className = "bpe-play-pause-btn";
    playPauseBtn.innerHTML = "▶️";
    playPauseBtn.title = "Play/Pause";

    const timeForwardBtn = document.createElement("button");
    timeForwardBtn.className = "bpe-time-fwd-btn";
    timeForwardBtn.innerHTML = "⏩";
    timeForwardBtn.title = "Forward 10 seconds";

    const trackForwardBtn = document.createElement("button");
    trackForwardBtn.className = "bpe-track-fwd-btn";
    trackForwardBtn.innerHTML = "👉";
    trackForwardBtn.title = "Go to next track";

    // === Event listeners for buttons ===
    trackBackwardBtn.addEventListener("click", () => {
      console.debug("Previous track button clicked");

      if (!plume.audioElement) {
        console.warn("No audio element found");
        return;
      }

      clickPreviousTrackButton();
      console.debug("Previous track event dispatched");
    });

    timeBackwardBtn.addEventListener("click", () => {
      console.debug("Rewind 10s button clicked");

      if (!plume.audioElement) {
        console.warn("No audio element found");
        return;
      }

      const newTime = Math.max(0, plume.audioElement.currentTime - 10);
      plume.audioElement.currentTime = newTime;
      console.debug(`Time rewound to: ${Math.round(newTime)}s`);
    });

    playPauseBtn.addEventListener("click", () => {
      if (!plume.audioElement) return;

      if (plume.audioElement.paused) {
        plume.audioElement.play();
        playPauseBtn.innerHTML = "⏸️";
      } else {
        plume.audioElement.pause();
        playPauseBtn.innerHTML = "▶️";
      }
    });

    timeForwardBtn.addEventListener("click", () => {
      console.debug("Forward 10s button clicked");

      if (!plume.audioElement) {
        console.warn("No audio element found");
        return;
      }

      const newTime = Math.min(plume.audioElement.duration || 0, plume.audioElement.currentTime + 10);
      plume.audioElement.currentTime = newTime;
      console.debug(`Time forwarded to: ${Math.round(newTime)}s`);
    });

    trackForwardBtn.addEventListener("click", () => {
      console.debug("Next track button clicked");

      if (!plume.audioElement) {
        console.warn("No audio element found");
        return;
      }

      clickNextTrackButton();
      console.debug("Next track event dispatched");
    });

    if (plume.audioElement) {
      plume.audioElement.addEventListener("play", () => {
        playPauseBtn.innerHTML = "⏸️";
      });

      plume.audioElement.addEventListener("pause", () => {
        playPauseBtn.innerHTML = "▶️";
      });

      // Initial state
      playPauseBtn.innerHTML = plume.audioElement.paused ? "▶️" : "⏸️";
    }

    container.appendChild(trackBackwardBtn);
    container.appendChild(timeBackwardBtn);
    container.appendChild(playPauseBtn);
    container.appendChild(timeForwardBtn);
    container.appendChild(trackForwardBtn);

    return container;
  };

  const createProgressBar = () => {
    if (!plume.audioElement || plume.progressBar) return;

    const container = document.createElement("div");
    container.className = "bpe-progress-container";

    const progressBarElement = document.createElement("div");
    progressBarElement.className = "bpe-progress-bar";

    const progressFillElement = document.createElement("div");
    progressFillElement.className = "bpe-progress-fill";
    progressFillElement.style.width = "0%";

    const progressHandleElement = document.createElement("div");
    progressHandleElement.className = "bpe-progress-handle";

    progressFillElement.appendChild(progressHandleElement);
    progressBarElement.appendChild(progressFillElement);

    const timeDisplay = document.createElement("div");
    timeDisplay.className = "bpe-time-display";

    const currentTime = document.createElement("span");
    currentTime.textContent = "0:00";

    const duration = document.createElement("span");
    duration.textContent = "0:00";

    timeDisplay.appendChild(currentTime);
    timeDisplay.appendChild(duration);

    container.appendChild(progressBarElement);
    container.appendChild(timeDisplay);

    let isMouseDown = false;

    const updateProgress = (event: MouseEvent | BcProgressEvent) => {
      const rect = progressBarElement.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
      const newTime = (percent / 100) * (plume.audioElement?.duration ?? 0);

      if (!isNaN(newTime) && isFinite(newTime) && plume.audioElement) {
        plume.audioElement.currentTime = newTime;
      }
    };

    progressBarElement.addEventListener("mousedown", (e) => {
      isMouseDown = true;
      plume.isDragging = true;
      updateProgress(e);
    });

    document.addEventListener("mousemove", (e) => {
      if (isMouseDown) {
        updateProgress(e);
      }
    });

    document.addEventListener("mouseup", () => {
      isMouseDown = false;
      plume.isDragging = false;
    });

    progressBarElement.addEventListener("click", updateProgress);

    plume.progressBar = progressBarElement;
    plume.progressFill = progressFillElement;
    plume.progressHandle = progressHandleElement;
    plume.currentTimeDisplay = currentTime;
    plume.durationDisplay = duration;

    return container;
  };

  const updateProgressBar = () => {
    if (!plume.audioElement || !plume.progressFill || plume.isDragging) return;

    const currentTime = plume.audioElement.currentTime;
    const duration = plume.audioElement.duration;

    if (!isNaN(duration) && duration > 0) {
      const percent = (currentTime / duration) * 100;
      plume.progressFill.style.width = `${percent}%`;

      if (plume.currentTimeDisplay) {
        plume.currentTimeDisplay.textContent = formatTime(currentTime);
      }

      if (plume.durationDisplay) {
        plume.durationDisplay.textContent = formatTime(duration);
      }
    }
  };

  const injectEnhancements = async () => {
    const bcPlayerSelectors = [
      ".inline_player",
      "#trackInfoInner",
      ".track_play_auxiliary",
      ".track_play_hilite",
      ".track_play_area",
    ];

    let playerContainer = null;
    for (const selector of bcPlayerSelectors) {
      playerContainer = document.querySelector(selector);
      if (playerContainer) break;
    }

    if (!playerContainer) {
      console.warn("Player container not found, alternative search...");
      // Search near audio elements
      if (plume.audioElement) {
        playerContainer = plume.audioElement.closest("div") || plume.audioElement.parentElement;
      }
    }

    if (!playerContainer) {
      console.error("Unable to find a suitable container");
      return;
    }

    // Hide or remove old player elements
    hideOriginalPlayerElements();

    // Create main container for our enhancements
    const plumeContainer = document.createElement("div");
    plumeContainer.className = "bpe-plume";

    const progressContainer = createProgressBar();
    if (progressContainer) {
      plumeContainer.appendChild(progressContainer);
    }

    // Create title display
    const titleContainer = document.createElement("div");
    titleContainer.className = "bpe-title-display";

    const titleText = document.createElement("div");
    titleText.className = "bpe-title-text";
    titleText.textContent = getCurrentTrackTitle();

    titleContainer.appendChild(titleText);
    plume.titleDisplay = titleContainer;
    plumeContainer.appendChild(titleContainer);

    const playbackControls = createPlaybackControls();
    if (playbackControls) {
      plumeContainer.appendChild(playbackControls);
    }

    const volumeContainer = await createVolumeSlider();
    if (volumeContainer) {
      plumeContainer.appendChild(volumeContainer);
    }

    playerContainer.appendChild(plumeContainer);

    console.log("BC-Plume successfully deployed");
  };

  const setupAudioListeners = () => {
    if (!plume.audioElement) return;

    // Update progress bar
    plume.audioElement.addEventListener("timeupdate", updateProgressBar);
    plume.audioElement.addEventListener("loadedmetadata", updateProgressBar);
    plume.audioElement.addEventListener("durationchange", updateProgressBar);

    // Update title when metadata loads (new track)
    plume.audioElement.addEventListener("loadedmetadata", updateTitleDisplay);
    plume.audioElement.addEventListener("loadstart", updateTitleDisplay);

    // Sync volume with Plume's slider
    plume.audioElement.addEventListener("volumechange", () => {
      if (plume.volumeSlider) {
        plume.volumeSlider.value = `${Math.round(plume.audioElement!.volume * 100)}`;
        const valueDisplay = plume.volumeSlider.parentElement!.querySelector(".bpe-volume-value");
        if (valueDisplay) {
          valueDisplay.textContent = `${plume.volumeSlider.value}%`;
        }

        // Save volume when it changes (even if not via our slider)
        saveNewVolume(plume.audioElement!.volume);
      }
    });

    console.info("Audio event listeners set up");
  };

  // Main initialization function
  const init = async () => {
    console.info("Initializing BC-Plume...");

    // Wait for the page to be fully loaded
    if (document.readyState !== "complete") {
      window.addEventListener("load", init);
      return;
    }

    plume.audioElement = await findAudioElement();
    if (!plume.audioElement) {
      console.warn("Audio element not found, retrying in 2s...");
      setTimeout(init, 2000);
      return;
    }

    const plumeIsAlreadyInjected = document.querySelector(".bpe-plume");
    if (plumeIsAlreadyInjected) return;

    // Inject enhancements
    await injectEnhancements();
    setupAudioListeners();
    initPlayback();

    // Debug: show detected controls
    debugBandcampControls();

    console.log("BC-Plume initialized successfully");
  };

  // Observe DOM changes for players that load dynamically
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(async (mutation) => {
      if (mutation.type === "childList") {
        // Check if a new audio element was added
        const newAudio = document.querySelector(BC_ELEM_IDENTIFIERS.audioPlayer) as HTMLAudioElement;
        if (newAudio && newAudio !== plume.audioElement) {
          console.info("New audio element detected");

          // Load and apply saved volume to the new element
          await loadSavedVolume();
          newAudio.volume = plume.savedVolume;
          console.info(`Volume applied to new audio: ${Math.round(plume.savedVolume * 100)}%`);

          plume.audioElement = newAudio;

          // Reset if needed
          if (!document.querySelector(".bpe-plume")) {
            setTimeout(init, 500);
          }
        }

        // Check if the title section has changed (new track)
        if (
          mutation.target instanceof Element &&
          (mutation.target.classList.contains(BC_ELEM_IDENTIFIERS.currentTrackTitle.slice(1)) ||
            mutation.target.querySelector(BC_ELEM_IDENTIFIERS.currentTrackTitle))
        ) {
          updateTitleDisplay();
        }
      }
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  init();

  // Support for SPA navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log("Navigation detected, resetting...");
      setTimeout(() => {
        init();
        // Update title after navigation in case the track changed
        setTimeout(updateTitleDisplay, 500);
      }, 1000);
    }
  }).observe(document, { subtree: true, childList: true });
})();
