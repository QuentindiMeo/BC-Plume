// Plume - TypeScript Content Script

interface AnyBrowserStorageAPI {
  storage: {
    local: {
      get: (keys: Array<string>) => Promise<any>;
      set: (items: any) => Promise<void>;
    };
  };
}
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

enum PLUME_SVG {
  logo = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 339.901 100">
      <svg width="55.3" height="100" viewBox="0 0 55.3 55.3" xmlns="http://www.w3.org/2000/svg" x="0">
        <g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" font-size="9pt" stroke="#000" stroke-width="0.01mm" fill="#000" style="stroke:#000;stroke-width:0.01mm;fill:#1da0c3">
          <path d="M 5.8 8.201 L 9 1.201 Q 19.4 1.201 19.4 10.201 L 19.4 12.301 Q 22.3 6.901 26.9 3.451 Q 31.5 0.001 37.6 0.001 Q 43 0.001 47 2.751 Q 51 5.501 53.15 10.351 Q 55.3 15.201 55.3 21.601 Q 55.3 29.001 53.15 35.051 Q 51 41.101 47.3 45.451 Q 43.6 49.801 39 52.101 Q 34.4 54.401 29.5 54.401 Q 24.7 54.401 20.55 52.001 Q 16.4 49.601 14.1 46.101 L 9 75.201 L 0 75.201 L 10.4 15.701 Q 10.7 14.001 10.7 12.901 Q 10.7 8.201 5.8 8.201 Z M 17.3 27.901 L 15.5 38.001 Q 17.7 42.001 21.2 44.201 Q 24.7 46.401 28.7 46.401 Q 33.4 46.401 37.35 43.351 Q 41.3 40.301 43.7 34.901 Q 46.1 29.501 46.1 22.501 Q 46.1 15.701 43 11.751 Q 39.9 7.801 34.9 7.801 Q 30.9 7.801 27.25 10.301 Q 23.6 12.801 21 17.301 Q 18.4 21.801 17.3 27.901 Z" id="0" vector-effect="non-scaling-stroke" />
        </g>
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="90" height="100%" viewBox="0 0 24 24" fill="none" stroke="#1da0c3" stroke-width="0.5mm" stroke-linecap="round" stroke-linejoin="round" class="feather feather-feather" x="51.3">
        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
        <line x1="16" y1="8" x2="2" y2="22"></line>
        <line x1="17.5" y1="15" x2="9" y2="15"></line>
      </svg>
      <svg width="194.601" height="100%" viewBox="0 0 194.601 54.401" xmlns="http://www.w3.org/2000/svg" x="145.3">
        <g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" font-size="9pt" stroke="#1da0c3" stroke-width="0.01mm" fill="#000" style="stroke:#1da0c3;stroke-width:0.01mm;fill:#1da0c3">
          <path d="M 0.4 34.301 L 6.1 1.201 L 15.1 1.201 L 9.3 34.101 Q 9.2 35.101 9.1 35.851 Q 9 36.601 9 37.501 Q 9 42.001 11.6 44.201 Q 14.2 46.401 17.7 46.401 Q 21.5 46.401 25.15 44.051 Q 28.8 41.701 31.6 37.301 Q 34.4 32.901 35.5 26.701 L 40 1.201 L 49 1.201 L 42.4 39.101 Q 42.3 39.601 42.25 40.251 Q 42.2 40.901 42.2 41.601 Q 42.2 44.401 43.8 45.551 Q 45.4 46.701 48 46.701 L 44.9 53.701 Q 39.5 53.701 36.65 51.051 Q 33.8 48.401 33.8 42.801 L 33.8 41.901 Q 26.5 54.401 14.7 54.401 Q 10.7 54.401 7.35 52.601 Q 4 50.801 2 47.551 Q 0 44.301 0 39.801 Q 0 38.501 0.1 37.151 Q 0.2 35.801 0.4 34.301 Z" id="0" vector-effect="non-scaling-stroke" />
          <path d="M 103.2 31.701 L 99.4 53.201 L 90.4 53.201 L 96.1 22.101 Q 96.6 19.701 96.7 18.551 Q 96.8 17.401 96.8 16.401 Q 96.8 12.501 94.55 10.201 Q 92.3 7.901 88.7 7.901 Q 85.2 7.901 81.3 10.501 Q 77.4 13.101 74.2 18.551 Q 71 24.001 69.5 32.501 L 65.9 53.201 L 56.9 53.201 L 66 1.201 L 74.7 1.201 L 72.5 13.201 Q 75.5 7.201 80.65 3.601 Q 85.8 0.001 91.3 0.001 Q 97.5 0.001 101.3 3.751 Q 105.1 7.501 105.6 13.201 Q 109 7.001 113.95 3.501 Q 118.9 0.001 124.7 0.001 Q 131.4 0.001 135.35 4.151 Q 139.3 8.301 139.3 14.301 Q 139.3 16.801 138.7 20.601 L 132.9 53.201 L 123.9 53.201 L 129.6 22.101 Q 130.1 19.701 130.2 18.551 Q 130.3 17.401 130.3 16.401 Q 130.3 12.501 128.05 10.201 Q 125.8 7.901 122.2 7.901 Q 118.9 7.901 115 10.401 Q 111.1 12.901 107.9 18.151 Q 104.7 23.401 103.2 31.701 Z" id="1" vector-effect="non-scaling-stroke" />
          <path d="M 187.6 42.501 L 188.4 50.501 Q 185.4 51.901 180.8 53.151 Q 176.2 54.401 170.6 54.401 Q 164 54.401 158.95 51.551 Q 153.9 48.701 151.05 43.351 Q 148.2 38.001 148.2 30.701 Q 148.2 22.401 151.65 15.401 Q 155.1 8.401 161.45 4.201 Q 167.8 0.001 176.3 0.001 Q 182.1 0.001 186.15 2.201 Q 190.2 4.401 192.4 7.901 Q 194.6 11.401 194.6 15.401 Q 194.6 20.901 192 24.501 Q 189.4 28.101 185.3 30.051 Q 181.2 32.001 176.45 32.801 Q 171.7 33.601 167.4 33.601 Q 164.7 33.601 162.05 33.351 Q 159.4 33.101 157.4 32.801 Q 158.2 39.401 162.1 42.901 Q 166 46.401 172.1 46.401 Q 177.1 46.401 181 45.101 Q 184.9 43.801 187.6 42.501 Z M 175.6 7.601 Q 170.9 7.601 167.1 9.951 Q 163.3 12.301 160.85 16.351 Q 158.4 20.401 157.6 25.601 Q 159.9 26.001 162.25 26.251 Q 164.6 26.501 167.4 26.501 Q 175.8 26.501 180.7 24.151 Q 185.6 21.801 185.6 16.101 Q 185.6 12.601 182.85 10.101 Q 180.1 7.601 175.6 7.601 Z" id="2" vector-effect="non-scaling-stroke" />
        </g>
      </svg>
    </svg>
  `,
  trackBackward = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 7H5V17H2V7Z" fill="currentColor" />
      <path d="M6 12L13.0023 7.00003V17L6 12Z" fill="currentColor" />
      <path d="M21.0023 7.00003L14 12L21.0023 17V7.00003Z" fill="currentColor" />
    </svg>
  `,
  timeBackward = `
    <svg fill="currentColor" width="24" height="24" viewBox="0 0 256 256" id="Flat" xmlns="http://www.w3.org/2000/svg">
      <path d="M136,80v43.38116l37.56934,21.69062a8,8,0,1,1-8,13.85644l-41.56934-24c-.064-.03692-.12109-.0805-.18359-.11889-.13575-.08362-.271-.16779-.40088-.2591-.10352-.07232-.20215-.14892-.30127-.22534-.10205-.0788-.20362-.15765-.30127-.24115-.11182-.09479-.21778-.19342-.32276-.29333-.0791-.07532-.15771-.15064-.23388-.22913-.10694-.11017-.2085-.22351-.30811-.339-.06933-.08026-.13769-.16083-.2041-.24377-.0918-.1156-.1792-.23352-.26416-.35352-.06738-.09473-.1333-.19019-.19629-.2879-.07226-.11194-.14062-.22547-.207-.34058-.06592-.11438-.12988-.22986-.19043-.34778-.05322-.10418-.10352-.20941-.15185-.31561-.061-.13287-.11915-.26685-.17334-.4035-.03907-.09986-.0752-.20063-.11036-.30194-.0498-.14252-.09668-.28589-.13818-.432-.03027-.10687-.05664-.21454-.083-.32257-.0332-.13928-.06543-.27881-.09131-.42084-.02392-.12842-.0415-.25757-.05908-.38714-.0166-.12226-.0332-.244-.04394-.368-.01416-.16015-.01953-.3208-.02442-.48187C120.00879,128.14313,120,128.07269,120,128V80a8,8,0,0,1,16,0Zm59.88184-19.88232a96.10782,96.10782,0,0,0-135.76416,0L51.833,68.4021l-14.34278-14.343A7.99981,7.99981,0,0,0,23.8335,59.71582v40a7.99977,7.99977,0,0,0,8,8h40a7.99981,7.99981,0,0,0,5.65673-13.65674L63.147,79.71576l8.28467-8.28461a80.00025,80.00025,0,1,1,0,113.13721,8.00035,8.00035,0,0,0-11.314,11.31445A96.0001,96.0001,0,0,0,195.88184,60.11768Z"/>
    </svg>
  `,
  playPlay = `
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 12.3301L9 16.6603L9 8L15 12.3301Z" fill="currentColor" />
    </svg>
  `,
  playPause = `
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 7H8V17H11V7Z" fill="currentColor" />
      <path d="M13 17H16V7H13V17Z" fill="currentColor" />
    </svg>
  `,
  timeForward = `
    <svg fill="currentColor" width="24" height="24" viewBox="0 0 256 256" id="Flat" xmlns="http://www.w3.org/2000/svg">
      <path d="M136,80v43.38116l37.56934,21.69062a8,8,0,1,1-8,13.85644l-41.56934-24c-.064-.03692-.12109-.0805-.18359-.11889-.13575-.08362-.271-.16779-.40088-.2591-.10352-.07232-.20215-.14892-.30127-.22534-.10205-.0788-.20362-.15765-.30127-.24115-.11182-.09479-.21778-.19342-.32276-.29333-.0791-.07532-.15771-.15064-.23388-.22913-.10694-.11017-.2085-.22351-.30811-.339-.06933-.08026-.13769-.16083-.2041-.24377-.0918-.1156-.1792-.23352-.26416-.35352-.06738-.09473-.1333-.19019-.19629-.2879-.07226-.11194-.14062-.22547-.207-.34058-.06592-.11438-.12988-.22986-.19043-.34778-.05322-.10418-.10352-.20941-.15186-.31561-.061-.13287-.11914-.26685-.17333-.4035-.03907-.09986-.0752-.20063-.11036-.30194-.0498-.14252-.09668-.28589-.13818-.432-.03027-.10687-.05664-.21454-.083-.32257-.0332-.13928-.06543-.27881-.09131-.42084-.02392-.12842-.0415-.25757-.05908-.38714-.0166-.12226-.0332-.244-.04394-.368-.01416-.16015-.01954-.3208-.02442-.48187C120.00879,128.14313,120,128.07269,120,128V80a8,8,0,0,1,16,0Zm91.228-27.67529a7.99962,7.99962,0,0,0-8.71826,1.73437L204.1665,68.40222l-8.28466-8.28454a95.9551,95.9551,0,1,0,0,135.76464,7.99983,7.99983,0,1,0-11.31348-11.31347,80.00009,80.00009,0,1,1,0-113.1377l8.28467,8.28467L178.50977,94.05908a7.99981,7.99981,0,0,0,5.65673,13.65674h40a7.99977,7.99977,0,0,0,8-8v-40A8.00014,8.00014,0,0,0,227.228,52.32471Z"/>
    </svg>
  `,
  trackForward = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.0023 17H18.0023V7H21.0023V17Z" fill="currentColor" />
      <path d="M17.0023 12L10 17V7L17.0023 12Z" fill="currentColor" />
      <path d="M2 17L9.00232 12L2 7V17Z" fill="currentColor" />
    </svg>
  `,
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
      const titleText = plume.titleDisplay.querySelector(".bpe-header-title");
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
    trackBackwardBtn.innerHTML = PLUME_SVG.trackBackward;
    trackBackwardBtn.title = "Go to previous track";

    const timeBackwardBtn = document.createElement("button");
    timeBackwardBtn.className = "bpe-time-bwd-btn";
    timeBackwardBtn.innerHTML = PLUME_SVG.timeBackward;
    timeBackwardBtn.title = "Rewind 10 seconds";

    const playPauseBtn = document.createElement("button");
    playPauseBtn.className = "bpe-play-pause-btn";
    playPauseBtn.innerHTML = PLUME_SVG.playPlay;
    playPauseBtn.title = "Play/Pause";

    const timeForwardBtn = document.createElement("button");
    timeForwardBtn.className = "bpe-time-fwd-btn";
    timeForwardBtn.innerHTML = PLUME_SVG.timeForward;
    timeForwardBtn.title = "Forward 10 seconds";

    const trackForwardBtn = document.createElement("button");
    trackForwardBtn.className = "bpe-track-fwd-btn";
    trackForwardBtn.innerHTML = PLUME_SVG.trackForward;
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
        playPauseBtn.innerHTML = PLUME_SVG.playPause;
      } else {
        plume.audioElement.pause();
        playPauseBtn.innerHTML = PLUME_SVG.playPlay;
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
        playPauseBtn.innerHTML = PLUME_SVG.playPause;
      });

      plume.audioElement.addEventListener("pause", () => {
        playPauseBtn.innerHTML = PLUME_SVG.playPlay;
      });

      // Initial state
      playPauseBtn.innerHTML = plume.audioElement.paused ? PLUME_SVG.playPlay : PLUME_SVG.playPause;
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

    // Create title display
    const headerContainer = document.createElement("div");
    headerContainer.className = "bpe-header-display";

    const headerLogo = document.createElement("div");
    headerLogo.className = "bpe-header-logo";
    headerLogo.innerHTML = PLUME_SVG.logo;
    headerLogo.title = "BC-Plume - Bandcamp Player Enhancements";
    headerContainer.appendChild(headerLogo);

    const currentTitleSection = document.createElement("div");
    currentTitleSection.className = "bpe-header-current";
    const currentTitlePretext = document.createElement("span");
    currentTitlePretext.className = "bpe-header-title-pretext";
    currentTitlePretext.textContent = "currently playing: ";
    currentTitleSection.appendChild(currentTitlePretext);
    const currentTitleText = document.createElement("span");
    currentTitleText.className = "bpe-header-title";
    currentTitleText.textContent = getCurrentTrackTitle();
    currentTitleSection.appendChild(currentTitleText);
    headerContainer.appendChild(currentTitleSection);

    plume.titleDisplay = headerContainer;
    plumeContainer.appendChild(headerContainer);

    const progressContainer = createProgressBar();
    if (progressContainer) {
      plumeContainer.appendChild(progressContainer);
    }

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
