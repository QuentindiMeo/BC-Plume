// Extension-specific type definitions

/**
 * Browser API detection types
 */
export type BrowserAPI = typeof chrome | typeof browser | null;
export type BrowserType = "Chromium" | "Firefox" | "unknown";

/**
 * Audio player enhancement handles
 */
export interface MbappeObject {
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

/**
 * Volume storage interface
 */
export interface VolumeStorage {
  bandcamp_volume?: number;
}

/**
 * Debug control information
 */
export interface DebugControl {
  index: number;
  tagName: string;
  classes: string;
  title: string;
  text: string;
  onclick: string;
}

/**
 * Time formatting utilities
 */
export interface TimeFormat {
  minutes: number;
  seconds: number;
  formatted: string;
}

/**
 * Progress update event data
 */
export interface ProgressUpdateEvent {
  percent: number;
  currentTime: number;
  duration: number;
}

/**
 * Player control selectors
 */
export interface PlayerSelectors {
  elementsToHide: string[];
  playerContainers: string[];
  volumeControls: string[];
  progressBars: string[];
}

/**
 * Extension state management
 */
export interface ExtensionState {
  isInitialized: boolean;
  handles: BandcampHandles;
  browserAPI: BrowserAPI;
  browserType: BrowserType;
  lastUrl: string;
}

/**
 * Storage API compatibility layer
 */
export interface StorageAPI {
  get(keys: string[]): Promise<Record<string, any>>;
  set(items: Record<string, any>): Promise<void>;
}

/**
 * Event listener types for audio events
 */
export type AudioEventType =
  | "timeupdate"
  | "loadedmetadata"
  | "durationchange"
  | "volumechange"
  | "play"
  | "pause";

/**
 * Mouse event types for progress bar interaction
 */
export type MouseEventType = "mousedown" | "mousemove" | "mouseup" | "click";

/**
 * DOM mutation observer callback type
 */
export type MutationCallback = (
  mutations: MutationRecord[]
) => Promise<void> | void;

/**
 * Extension initialization options
 */
export interface InitOptions {
  retryDelay?: number;
  maxRetries?: number;
  observeChanges?: boolean;
  debugMode?: boolean;
}

/**
 * CSS class names used by the extension
 */
export const BPE_CLASS_NAMES = {
  ENHANCEMENTS: "bpe-enhancements",
  VOLUME_CONTAINER: "bpe-volume-container",
  VOLUME_LABEL: "bpe-volume-label",
  VOLUME_SLIDER: "bpe-volume-slider",
  VOLUME_VALUE: "bpe-volume-value",
  PROGRESS_CONTAINER: "bpe-progress-container",
  PROGRESS_BAR: "bpe-progress-bar",
  PROGRESS_FILL: "bpe-progress-fill",
  PROGRESS_HANDLE: "bpe-progress-handle",
  TIME_DISPLAY: "bpe-time-display",
  PLAYBACK_CONTROLS: "bpe-playback-controls",
  PLAY_PAUSE_BTN: "bpe-play-pause-btn",
  PREV_BTN: "bpe-prev-btn",
  NEXT_BTN: "bpe-next-btn",
  HIDDEN_ORIGINAL: "bpe-hidden-original",
} as const;

export type BPEClassName =
  (typeof BPE_CLASS_NAMES)[keyof typeof BPE_CLASS_NAMES];
