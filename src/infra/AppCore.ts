import { BcPageType, TimeDisplayMethodType } from "../domain/bandcamp";
import { IAction, IListener, IScenarioView, IStore } from "../domain/store";

interface AppPersistedState {
  volume: number;
  durationDisplayMethod: TimeDisplayMethodType;
}

interface AppTransientState {
  pageType: BcPageType | null;
  trackTitle: string | null;
  trackNumber: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isMuted: boolean;
  volumeBeforeMute: number;
  isFullscreen: boolean;
}

export interface AppCore extends AppPersistedState, AppTransientState {}

export enum CORE_ACTIONS {
  SET_PAGE_TYPE = "SET_PAGE_TYPE",
  SET_TRACK_TITLE = "SET_TRACK_TITLE",
  SET_TRACK_NUMBER = "SET_TRACK_NUMBER",
  SET_DURATION = "SET_DURATION",
  SET_CURRENT_TIME = "SET_CURRENT_TIME",
  SET_IS_PLAYING = "SET_IS_PLAYING",
  SET_DURATION_DISPLAY_METHOD = "SET_DURATION_DISPLAY_METHOD",
  SET_VOLUME = "SET_VOLUME",
  SET_IS_MUTED = "SET_IS_MUTED",
  TOGGLE_MUTE = "TOGGLE_MUTE",
  SET_IS_FULLSCREEN = "SET_IS_FULLSCREEN",
  RESET_TRANSIENT_STATE = "RESET_TRANSIENT_STATE",
}

export type CoreAction =
  | IAction<CORE_ACTIONS.SET_PAGE_TYPE, BcPageType | null>
  | IAction<CORE_ACTIONS.SET_TRACK_TITLE, string | null>
  | IAction<CORE_ACTIONS.SET_TRACK_NUMBER, string | null>
  | IAction<CORE_ACTIONS.SET_DURATION, number>
  | IAction<CORE_ACTIONS.SET_CURRENT_TIME, number>
  | IAction<CORE_ACTIONS.SET_IS_PLAYING, boolean>
  | IAction<CORE_ACTIONS.SET_DURATION_DISPLAY_METHOD, TimeDisplayMethodType>
  | IAction<CORE_ACTIONS.SET_VOLUME, number>
  | IAction<CORE_ACTIONS.SET_IS_MUTED, boolean>
  | IAction<CORE_ACTIONS.TOGGLE_MUTE>
  | IAction<CORE_ACTIONS.SET_IS_FULLSCREEN, boolean>
  | IAction<CORE_ACTIONS.RESET_TRANSIENT_STATE>;

export interface ICoreActions {
  setPageType: (pageType: BcPageType | null) => CoreAction;
  setTrackTitle: (title: string | null) => CoreAction;
  setTrackNumber: (number: string | null) => CoreAction;
  setDuration: (duration: number) => CoreAction;
  setCurrentTime: (time: number) => CoreAction;
  setIsPlaying: (isPlaying: boolean) => CoreAction;
  setDurationDisplayMethod: (method: TimeDisplayMethodType) => CoreAction;
  setVolume: (volume: number) => CoreAction;
  setIsMuted: (isMuted: boolean) => CoreAction;
  toggleMute: () => CoreAction;
  setIsFullscreen: (isFullscreen: boolean) => CoreAction;
  resetTransientState: () => CoreAction;
}

export type AppCoreListener<AppCoreProp extends keyof AppCore = keyof AppCore> = IListener<AppCore, AppCoreProp>;

/**
 * Computed properties - derived state calculated on-demand from selectors.
 * These are NOT stored in state, but computed when accessed.
 *
 * Benefits:
 * - No redundant state storage
 * - Always consistent with source data
 * - Lazy evaluation (only computed when needed)
 * - Can be memoized if performance becomes a concern
 */
interface ComputedState {
  /** Returns formatted elapsed time (MM:SS) */
  formattedElapsed: () => string;
  /** Returns formatted duration (MM:SS or -MM:SS for remaining) */
  formattedDuration: () => string;
  /** Returns progress percentage (0-100) */
  progressPercentage: () => number;
}

export interface IAppCore extends IStore<AppCore, CoreAction> {
  subscribe<AppCoreProp extends keyof AppCore>(key: AppCoreProp, listener: AppCoreListener<AppCoreProp>): () => void;
  subscribeAll(listener: (state: AppCore) => void): () => void;

  // Additional fields
  loadPersistedState(): Promise<void>;
  computed: ComputedState;

  // Scenario: time-travel debugging (dev-only)
  scenario: {
    // Undo the last dispatched action, restoring the previous state. Returns `true` if undo was applied.
    undo(): boolean;
    // Redo a previously undone action, re-applying it. Returns `true` if redo was applied.
    redo(): boolean;
    // Replay the recorded scenario up to `toIndex` (inclusive). Omit to replay all.
    replayScenario(toIndex?: number): void;
    // Get a read-only view of the recorded scenario timeline.
    getScenarioView(): IScenarioView<AppCore, CoreAction>;
    // Clear all recorded scenario entries.
    clearScenario(): void;
  };
}
