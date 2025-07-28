// BC-Plume - TypeScript Content Script

interface AnyBrowserStorageAPI {
  storage: {
    local: {
      get: (keys: Array<string>) => Promise<any>;
      set: (items: any) => Promise<void>;
    };
  };
}
type BrowserType = "Chromium" | "Firefox" | "unknown";

interface PlumeObject {
  audioElement: HTMLAudioElement | null;
  volumeSlider: HTMLInputElement | null;
  progressBar: HTMLDivElement | null;
  progressFill: HTMLDivElement | null;
  progressHandle: HTMLDivElement | null;
  currentTimeDisplay: HTMLSpanElement | null;
  durationDisplay: HTMLSpanElement | null;
  isDragging: boolean;
  savedVolume: number;
}

// Native Bandcamp volume storage interface
interface VolumeStorage {
  bandcamp_volume?: number;
}

// Debug control information
interface DebugControl {
  index: number;
  tagName: string;
  classes: string;
  title: string;
  text: string;
  onclick: string;
}

// Native Bandcamp media player progress event interface
interface BcProgressEvent {
  clientX: number;
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

  // Initialize Plume object
  const plume: PlumeObject = {
    audioElement: null,
    volumeSlider: null,
    progressBar: null,
    progressFill: null,
    progressHandle: null,
    currentTimeDisplay: null,
    durationDisplay: null,
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

  // Function to find the audio element
  const findAudioElement = async (): Promise<HTMLAudioElement | null> => {
    const audio = document.querySelector("audio");
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

    const slider = {
      ...document.createElement("input"),
      type: "range",
      min: "0",
      max: "100",
      value: Math.round(plume.savedVolume * 100).toString(),
      className: "bpe-volume-slider",
    }

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
    const bcElementsToHide = [
      ".progbar",
      ".progbar_empty",
      ".timeindicator",
      ".time_indicator",
      ".volume_ctrl",
      ".vol_slider",
      ".volumeslider",
      ".progress",
      ".progress-bar",
      ".tracktime",
      ".time_total",
      ".time_elapsed",
      ".scrubber",
      ".playhead",
      ".track-progress",
      ".playbar",
    ];

    bcElementsToHide.forEach((selector) => {
      const elements = document.querySelectorAll(selector) as unknown as Array<HTMLElement>;
      elements.forEach((element) => {
        element.style.display = "none";
        element.classList.add("bpe-hidden-original");
      });
    });

    const bcVolumeControls = document.querySelectorAll(
      '[class*="volume"], [class*="vol"]'
    ) as unknown as Array<HTMLInputElement>;
    bcVolumeControls.forEach((element) => {
      if (element.tagName.toLowerCase() === "input" && element.type === "range") {
        element.style.display = "none";
        element.classList.add("bpe-hidden-original");
      }
    });

    const bcProgressBars = document.querySelectorAll('div[style*="width"][style*="%"]');
    bcProgressBars.forEach((element) => {
      const parent = element.parentElement;
      if (
        parent &&
        (parent.className.includes("prog") || parent.className.includes("time") || parent.className.includes("scrub"))
      ) {
        parent.style.display = "none";
        parent.classList.add("bpe-hidden-original");
      }
    });

    console.log("Original player elements hidden");
  };

  // Function to restore original player elements (if needed)
  const restoreOriginalPlayerElements = () => {
    const hiddenElements = document.querySelectorAll(".bpe-hidden-original") as unknown as Array<HTMLElement>;
    hiddenElements.forEach((element) => {
      element.style.display = "";
      element.classList.remove("bpe-hidden-original");
    });

    console.log("Original player elements restored");
  };
  restoreOriginalPlayerElements();

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

    const playPauseBtn = document.createElement("button");
    playPauseBtn.className = "bpe-play-pause-btn";
    playPauseBtn.innerHTML = "▶️";
    playPauseBtn.title = "Play/Pause";

    const prevBtn = document.createElement("button");
    prevBtn.className = "bpe-prev-btn";
    prevBtn.innerHTML = "⏪";
    prevBtn.title = "Rewind 10 seconds";

    const nextBtn = document.createElement("button");
    nextBtn.className = "bpe-next-btn";
    nextBtn.innerHTML = "⏩";
    nextBtn.title = "Forward 10 seconds";

    // Event listeners for buttons
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

    prevBtn.addEventListener("click", () => {
      console.debug("Rewind 10s button clicked");

      if (!plume.audioElement) {
        console.warn("No audio element found");
        return;
      }

      const newTime = Math.max(0, plume.audioElement.currentTime - 10);
      plume.audioElement.currentTime = newTime;
      console.debug(`Time rewound to: ${Math.round(newTime)}s`);
    });

    nextBtn.addEventListener("click", () => {
      console.debug("Forward 10s button clicked");

      if (!plume.audioElement) {
        console.warn("No audio element found");
        return;
      }

      const newTime = Math.min(plume.audioElement.duration || 0, plume.audioElement.currentTime + 10);
      plume.audioElement.currentTime = newTime;
      console.debug(`Time forwarded to: ${Math.round(newTime)}s`);
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

    container.appendChild(prevBtn);
    container.appendChild(playPauseBtn);
    container.appendChild(nextBtn);

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
    const enhancementsContainer = document.createElement("div");
    enhancementsContainer.className = "bpe-enhancements";

    const progressContainer = createProgressBar();
    if (progressContainer) {
      enhancementsContainer.appendChild(progressContainer);
    }

    const playbackControls = createPlaybackControls();
    if (playbackControls) {
      enhancementsContainer.appendChild(playbackControls);
    }

    const volumeContainer = await createVolumeSlider();
    if (volumeContainer) {
      enhancementsContainer.appendChild(volumeContainer);
    }

    playerContainer.appendChild(enhancementsContainer);

    console.log("BC-Plume successfully deployed");
  };

  const setupAudioListeners = () => {
    if (!plume.audioElement) return;

    // Update progress bar
    plume.audioElement.addEventListener("timeupdate", updateProgressBar);
    plume.audioElement.addEventListener("loadedmetadata", updateProgressBar);
    plume.audioElement.addEventListener("durationchange", updateProgressBar);

    // Sync volume with PLUME's slider
    plume.audioElement.addEventListener("volumechange", () => {
      if (plume.volumeSlider) {
        plume.volumeSlider.value = Math.round(plume.audioElement!.volume * 100).toString();
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

    const plumeIsAlreadyInjected = document.querySelector(".bpe-enhancements");
    if (plumeIsAlreadyInjected) return;

    // Inject enhancements
    await injectEnhancements();
    setupAudioListeners();

    // Debug: show detected controls
    debugBandcampControls();

    console.log("PLUME initialized successfully");
  };

  // Observe DOM changes for players that load dynamically
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(async (mutation) => {
      if (mutation.type === "childList") {
        // Check if a new audio element was added
        const newAudio = document.querySelector("audio");
        if (newAudio && newAudio !== plume.audioElement) {
          console.info("New audio element detected");

          // Load and apply saved volume to the new element
          await loadSavedVolume();
          newAudio.volume = plume.savedVolume;
          console.info(`Volume applied to new audio: ${Math.round(plume.savedVolume * 100)}%`);

          plume.audioElement = newAudio;

          // Reset if needed
          if (!document.querySelector(".bpe-enhancements")) {
            setTimeout(init, 500);
          }
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
      setTimeout(init, 1000);
    }
  }).observe(document, { subtree: true, childList: true });
})();
