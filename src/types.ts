export enum BROWSER_TYPE {
  CHROMIUM = "Chromium",
  FIREFOX = "Firefox",
}
export type BrowserType = `${BROWSER_TYPE}`;

export enum TIME_DISPLAY_METHOD {
  DURATION = "duration",
  REMAINING = "remaining",
}
export type TimeDisplayMethodType = `${TIME_DISPLAY_METHOD}`;

export interface PlumeCore {
  audioElement: HTMLAudioElement | null;
  titleDisplay: HTMLDivElement | null;
  progressSlider: HTMLInputElement | null;
  elapsedDisplay: HTMLSpanElement | null;
  durationDisplay: HTMLSpanElement | null;
  durationDisplayMethod: TimeDisplayMethodType;
  volumeSlider: HTMLInputElement | null;
  muteBtn: HTMLButtonElement | null;
  savedVolume: number;
  playerVolume: number;
}

export enum PLUME_CACHE_KEYS {
  DURATION_DISPLAY_METHOD = "plume_duration_display_method",
  VOLUME = "plume_volume",
}
export interface LocalStorage {
  [PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD]: TimeDisplayMethodType | undefined;
  [PLUME_CACHE_KEYS.VOLUME]: number | undefined;
}

export interface DebugControl {
  index: number;
  tagName: string;
  classes: string;
  title: string;
  text: string;
  onclick: string;
}

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

export enum BC_ELEM_IDENTIFIERS {
  infoSection = "div#name-section",
  trackView = "div.trackView",
  fromAlbum = "span.fromAlbum",
  playerParent = "div.inline_player",
  inlinePlayerTable = "div.inline_player>table",
  audioPlayer = "audio",
  playPause = "div.playbutton",
  songPageCurrentTrackTitle = "h2.trackTitle",
  albumPageCurrentTrackTitle = "a.title_link",
  previousTrack = "div.prevbutton",
  nextTrack = "div.nextbutton",
  trackList = "table#track_table",
  trackRow = "tr.track_row_view",
  trackTitle = "span.track-title",
  trackDuration = "span.time",
  coverArt = "div#tralbumArt img",
}
