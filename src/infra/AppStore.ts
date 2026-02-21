import { BcPageType, TimeDisplayMethodType } from "../domain/bandcamp";
import { AppState } from "../domain/state";
import { Action, Listener, ScenarioView, Store } from "../domain/store";

export enum STORE_ACTIONS {
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

export type AppAction =
  | Action<STORE_ACTIONS.SET_PAGE_TYPE, BcPageType | null>
  | Action<STORE_ACTIONS.SET_TRACK_TITLE, string | null>
  | Action<STORE_ACTIONS.SET_TRACK_NUMBER, string | null>
  | Action<STORE_ACTIONS.SET_DURATION, number>
  | Action<STORE_ACTIONS.SET_CURRENT_TIME, number>
  | Action<STORE_ACTIONS.SET_IS_PLAYING, boolean>
  | Action<STORE_ACTIONS.SET_DURATION_DISPLAY_METHOD, TimeDisplayMethodType>
  | Action<STORE_ACTIONS.SET_VOLUME, number>
  | Action<STORE_ACTIONS.SET_IS_MUTED, boolean>
  | Action<STORE_ACTIONS.TOGGLE_MUTE>
  | Action<STORE_ACTIONS.SET_IS_FULLSCREEN, boolean>
  | Action<STORE_ACTIONS.RESET_TRANSIENT_STATE>;

export interface IStoreActions {
  setPageType: (pageType: BcPageType | null) => AppAction;
  setTrackTitle: (title: string | null) => AppAction;
  setTrackNumber: (number: string | null) => AppAction;
  setDuration: (duration: number) => AppAction;
  setCurrentTime: (time: number) => AppAction;
  setIsPlaying: (isPlaying: boolean) => AppAction;
  setDurationDisplayMethod: (method: TimeDisplayMethodType) => AppAction;
  setVolume: (volume: number) => AppAction;
  setIsMuted: (isMuted: boolean) => AppAction;
  toggleMute: () => AppAction;
  setIsFullscreen: (isFullscreen: boolean) => AppAction;
  resetTransientState: () => AppAction;
}

export type AppStateListener<AppStateProp extends keyof AppState = keyof AppState> = Listener<AppState, AppStateProp>;

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

export interface AppStateStore extends Store<AppState, AppAction> {
  subscribe<AppStateProp extends keyof AppState>(
    key: AppStateProp,
    listener: AppStateListener<AppStateProp>
  ): () => void;
  subscribeAll(listener: (state: AppState) => void): () => void;

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
    getScenarioView(): ScenarioView<AppState, AppAction>;
    // Clear all recorded scenario entries.
    clearScenario(): void;
  };
}
