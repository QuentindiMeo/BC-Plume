export const PLUME_CONSTANTS = {
  TIME_BEFORE_RESTART: 5,
  PROGRESS_SLIDER_GRANULARITY: 1000, // use 1000 for better granularity: 1000s = 16m40s
  VOLUME_SLIDER_GRANULARITY: 100,
  AVAILABLE_HOTKEY_CODES: new Set([
    "Space",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "PageUp",
    "PageDown",
    "KeyF",
    "KeyM",
  ]),
};

export enum PLUME_CACHE_KEYS {
  DURATION_DISPLAY_METHOD = "plume_duration_display_method",
  VOLUME = "plume_volume",
}

export const PLUME_DEFAULTS = {
  savedVolume: 0.5,
} as const;

export enum PLUME_ELEM_IDENTIFIERS {
  bcElements = "div#bpe-hidden-original",
  plumeContainer = "div#bpe-plume",
  headerContainer = "div#bpe-header-container",
  headerLogo = "a#bpe-header-logo",
  headerCurrent = "div#bpe-header-current",
  headerTitlePretext = "span#bpe-header-title-pretext",
  headerTitle = "span#bpe-header-title",
  playbackManager = "div#bpe-playback-manager",
  playbackControls = "div#bpe-playback-controls",
  progressContainer = "div#bpe-progress-container",
  progressSlider = "input#bpe-progress-slider",
  timeDisplay = "div#bpe-time-display",
  elapsedDisplay = "span#bpe-elapsed-display",
  durationDisplay = "span#bpe-duration-display",
  trackBwdBtn = "button#bpe-track-bwd-btn",
  timeBwdBtn = "button#bpe-time-bwd-btn",
  playPauseBtn = "button#bpe-play-pause-btn",
  timeFwdBtn = "button#bpe-time-fwd-btn",
  trackFwdBtn = "button#bpe-track-fwd-btn",
  fullscreenBtn = "button#bpe-fullscreen-btn",
  fullscreenBtnLabel = "span#bpe-fullscreen-btn-label",
  volumeContainer = "div#bpe-volume-container",
  muteBtn = "button#bpe-mute-btn",
  volumeSlider = "input#bpe-volume-slider",
  volumeValue = "div#bpe-volume-value",
  fullscreenBtnContainer = "div#bpe-fullscreen-btn-container",
  fullscreenOverlay = "div#bpe-fullscreen-overlay",
  fullscreenBackground = "div#bpe-fullscreen-background",
  fullscreenContent = "div#bpe-fullscreen-content",
  fullscreenExitBtn = "button#bpe-fullscreen-exit-btn",
  fullscreenPresentationContainer = "div#bpe-fullscreen-presentation",
  fullscreenCoverArt = "img#bpe-fullscreen-cover-art",
  fullscreenTitlingContainer = "div.bpe-fullscreen-titling",
  fullscreenTitlingProject = "h2#bpe-fullscreen-titling__project",
  fullscreenTitlingArtist = "h3#bpe-fullscreen-titling__artist",
  fullscreenClone = "div#bpe-fullscreen-clone",
}
