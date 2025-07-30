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
    <svg id="logo_plume" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 557.57 299.3" author="Rebecca ȘES">
      <defs>
        <style>
          .cls-1, .cls-2 { fill: #20a0c3; fill-rule: evenodd; }
          .cls-2, .cls-3, .cls-4 { stroke: #20a0c3; }
          .cls-2, .cls-4 { stroke-linecap: round; }
          .cls-2 { stroke-miterlimit:7.2; stroke-width: 0.05px; }
          .cls-3, .cls-4 { fill: none; stroke-linejoin: round; }
          .cls-3 { stroke-linecap: square; stroke-width: 9.57px; }
          .cls-4 { stroke-width: 9.57px; }
        </style>
      </defs>
      <g id="plume_p">
        <path id="_0" class="cls-1" d="M74.13,979.67l5.76-12.6q18.72,0,18.73,16.21v3.78a48,48,0,0,1,13.5-15.94,31.23,31.23,0,0,1,19.27-6.21,29.13,29.13,0,0,1,16.92,5,31.75,31.75,0,0,1,11.07,13.69,49.56,49.56,0,0,1,3.87,20.25,72,72,0,0,1-3.87,24.22,59.1,59.1,0,0,1-10.53,18.72,47.42,47.42,0,0,1-14.94,12,37.87,37.87,0,0,1-17.11,4.14,31.64,31.64,0,0,1-16.11-4.32,33.76,33.76,0,0,1-11.62-10.63l-9.18,52.4H63.69L82.41,993.18a30.13,30.13,0,0,0,.54-5Q83,979.68,74.13,979.67Zm20.7,35.48-3.24,18.18a29.84,29.84,0,0,0,10.27,11.16,24.92,24.92,0,0,0,29.08-1.53,38.45,38.45,0,0,0,11.43-15.21,54.51,54.51,0,0,0,4.32-22.33q0-12.24-5.58-19.35A17.68,17.68,0,0,0,126.52,979a24,24,0,0,0-13.77,4.51,37.88,37.88,0,0,0-11.25,12.6A58.91,58.91,0,0,0,94.83,1015.15Z" transform="translate(-63.69 -801.01)"/>
      </g>
      <path class="cls-3" d="M243.36,825.94l-43.11,234.35" transform="translate(-63.69 -801.01)"/>
      <path class="cls-4" d="M253.15,969.13c8.64-9.47,12.22-22,12.54-34.22s-2.38-24.34-5.06-36.33q-5.25-23.45-10.49-46.91c-3.47-15.54-6.43-33.29,4.34-45.88-3.54.48-5,2.23-7.6,4.46-31,26.91-45,67.67-39.87,106" transform="translate(-63.69 -801.01)"/>
      <path class="cls-4" d="M194.23,973.42l15.37,36a172.86,172.86,0,0,1,22.52-26.25" transform="translate(-63.69 -801.01)"/>
      <path class="cls-4" d="M190.85,999l15.37,36a172.52,172.52,0,0,1,22.53-26.25" transform="translate(-63.69 -801.01)"/>
      <g id="plume_ume">
        <path id="plume_u" class="cls-2" d="M271.57,1026.72l10.26-59.59H298l-10.45,59.23q-.18,1.8-.36,3.15a22.57,22.57,0,0,0-.18,3q0,8.12,4.69,12.07a16.47,16.47,0,0,0,11,4,24.51,24.51,0,0,0,13.41-4.23,39.07,39.07,0,0,0,11.62-12.16,52.17,52.17,0,0,0,7-19.08l8.1-45.91h16.21l-11.89,68.23a18,18,0,0,0-.27,2.08q-.09,1.17-.09,2.43,0,5,2.88,7.11a12.67,12.67,0,0,0,7.56,2.07l-5.58,12.6q-9.72,0-14.85-4.77T331.71,1042v-1.62q-13.15,22.5-34.39,22.5a27.54,27.54,0,0,1-13.24-3.24,25,25,0,0,1-9.63-9.09,26.09,26.09,0,0,1-3.6-13.95c0-1.57.06-3.16.18-4.78S271.33,1028.52,271.57,1026.72Z" transform="translate(-63.69 -801.01)"/>
        <path id="plume_m" class="cls-2" d="M456.66,1022l-6.84,38.71h-16.2l10.26-56a60.78,60.78,0,0,0,1.08-6.4q.18-2.07.18-3.87,0-7-4.05-11.16a14.08,14.08,0,0,0-10.53-4.14q-6.31,0-13.33,4.68t-12.78,14.49q-5.76,9.82-8.46,25.12l-6.49,37.27H373.3l16.38-93.62h15.67l-4,21.6a45.41,45.41,0,0,1,14.67-17.28q9.27-6.48,19.18-6.49,11.16,0,18,6.76a26.3,26.3,0,0,1,7.74,17,50.92,50.92,0,0,1,15-17.46A32.85,32.85,0,0,1,495.37,965q12.08,0,19.18,7.48a25.51,25.51,0,0,1,7.11,18.27,75.51,75.51,0,0,1-1.08,11.35l-10.44,58.69H493.93l10.27-56a60.78,60.78,0,0,0,1.08-6.4q.18-2.07.18-3.87,0-7-4-11.16a14.1,14.1,0,0,0-10.54-4.14q-5.94,0-13,4.5t-12.78,13.95Q459.35,1007.11,456.66,1022Z" transform="translate(-63.69 -801.01)"/>
        <path id="plume_e" class="cls-2" d="M608.63,1041.49l1.44,14.4a86.46,86.46,0,0,1-13.69,4.77,70,70,0,0,1-18.36,2.25,42,42,0,0,1-21-5.13A35.9,35.9,0,0,1,542.82,1043q-5.13-9.63-5.13-22.78a61.48,61.48,0,0,1,6.21-27.55,50.41,50.41,0,0,1,17.64-20.16Q573,965,588.28,965q10.44,0,17.74,4a29.65,29.65,0,0,1,11.25,10.26,24.92,24.92,0,0,1,4,13.5q0,9.9-4.68,16.39a31.08,31.08,0,0,1-12.06,10,60.22,60.22,0,0,1-15.94,4.95,98.19,98.19,0,0,1-16.29,1.44q-4.86,0-9.64-.45t-8.37-1q1.44,11.88,8.46,18.19t18,6.3a50.58,50.58,0,0,0,16-2.34A101.94,101.94,0,0,0,608.63,1041.49ZM587,978.65a28.5,28.5,0,0,0-15.3,4.23,34,34,0,0,0-11.26,11.52,45.1,45.1,0,0,0-5.85,16.66q4.14.72,8.37,1.17a88.36,88.36,0,0,0,9.28.45q15.12,0,23.94-4.23T605,994a14.09,14.09,0,0,0-4.95-10.8Q595.12,978.65,587,978.65Z" transform="translate(-63.69 -801.01)"/>
      </g>
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

    const playbackManager = document.createElement("div");
    playbackManager.className = "bpe-playback-manager";

    const progressContainer = createProgressBar();
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
