import { BcPageType, TIME_DISPLAY_METHOD, TimeDisplayMethodType } from "../domain/bandcamp";
import { process } from "../domain/node";
import { PLUME_CACHE_KEYS, PLUME_DEFAULTS } from "../domain/plume";
import {
  Action,
  createScenarioRecorder,
  handleUnknownAction,
  Listener,
  ScenarioControls,
  ScenarioView,
  Store,
  Thunk,
} from "../domain/store";
import { CPL, logger } from "../features/logger";
import { presentFormattedDuration, presentFormattedElapsed, presentProgressPercentage } from "../features/presenters";
import { browserActions, getBrowserInstance } from "./BrowserImpl";

export interface AppPersistedState {
  volume: number;
  durationDisplayMethod: TimeDisplayMethodType;
}

export interface AppTransientState {
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

export interface AppState extends AppPersistedState, AppTransientState {}

enum STORE_ACTIONS {
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

type AppAction =
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

export const storeActions = {
  setPageType: (pageType: BcPageType | null): AppAction => ({
    type: STORE_ACTIONS.SET_PAGE_TYPE,
    payload: pageType,
  }),
  setTrackTitle: (title: string | null): AppAction => ({
    type: STORE_ACTIONS.SET_TRACK_TITLE,
    payload: title,
  }),
  setTrackNumber: (number: string | null): AppAction => ({
    type: STORE_ACTIONS.SET_TRACK_NUMBER,
    payload: number,
  }),
  setDuration: (duration: number): AppAction => ({
    type: STORE_ACTIONS.SET_DURATION,
    payload: duration,
  }),
  setCurrentTime: (time: number): AppAction => ({
    type: STORE_ACTIONS.SET_CURRENT_TIME,
    payload: time,
  }),
  setIsPlaying: (isPlaying: boolean): AppAction => ({
    type: STORE_ACTIONS.SET_IS_PLAYING,
    payload: isPlaying,
  }),
  setDurationDisplayMethod: (method: TimeDisplayMethodType): AppAction => ({
    type: STORE_ACTIONS.SET_DURATION_DISPLAY_METHOD,
    payload: method,
  }),
  setVolume: (volume: number): AppAction => ({
    type: STORE_ACTIONS.SET_VOLUME,
    payload: volume,
  }),
  setIsMuted: (isMuted: boolean): AppAction => ({
    type: STORE_ACTIONS.SET_IS_MUTED,
    payload: isMuted,
  }),
  toggleMute: (): AppAction => ({
    type: STORE_ACTIONS.TOGGLE_MUTE,
  }),
  setIsFullscreen: (isFullscreen: boolean): AppAction => ({
    type: STORE_ACTIONS.SET_IS_FULLSCREEN,
    payload: isFullscreen,
  }),
  resetTransientState: (): AppAction => ({
    type: STORE_ACTIONS.RESET_TRANSIENT_STATE,
  }),
} as const;

export type AppStateListener<AppStateProp extends keyof AppState = keyof AppState> = Listener<AppState, AppStateProp>;

const PERSISTED_KEYS: ReadonlySet<keyof AppState> = new Set<keyof AppState>(["volume", "durationDisplayMethod"]);
const PERSISTENCE_DELAY_MS = 200;

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

interface AppStateStore extends Store<AppState, AppAction> {
  subscribe<AppStateProp extends keyof AppState>(
    key: AppStateProp,
    listener: AppStateListener<AppStateProp>
  ): () => void;
  subscribeAll(listener: (state: AppState) => void): () => void;

  // * Additional fields
  loadPersistedState(): Promise<void>;
  computed: ComputedState;

  // * Scenario: time-travel debugging (dev-only)
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

const INITIAL_STATE: AppState = {
  pageType: null,
  trackTitle: null,
  trackNumber: null,
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION,
  volume: PLUME_DEFAULTS.savedVolume,
  isMuted: false,
  volumeBeforeMute: PLUME_DEFAULTS.savedVolume,
  isFullscreen: false,
};

let appStoreInstance: AppStateStore | null = null;

const createAppStateInstance = (): AppStateStore => {
  let state: AppState = { ...INITIAL_STATE };

  const listeners = new Map<keyof AppState, Set<AppStateListener<any>>>();
  const globalListeners = new Set<(state: AppState) => void>();

  let persistenceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingPersistedKeys = new Set<keyof AppState>();

  // Scenario recorder for time-travel debugging (test-only)
  const scenarioRecorder: ScenarioControls<AppState, AppAction> | null =
    process.env.NODE_ENV === "testing" ? createScenarioRecorder<AppState, AppAction>() : null;

  const persistState = (keys: Array<keyof AppState>): void => {
    // Accumulate all keys that need to be persisted during the debounce window
    keys.forEach((key) => {
      if (PERSISTED_KEYS.has(key)) pendingPersistedKeys.add(key);
    });

    if (persistenceTimer) clearTimeout(persistenceTimer);
    persistenceTimer = setTimeout(() => {
      const toSave: any = {};

      // Persist all pending keys that accumulated during debounce window
      for (const key of pendingPersistedKeys) {
        if (key === "volume") {
          toSave[PLUME_CACHE_KEYS.VOLUME] = state.volume;
        } else if (key === "durationDisplayMethod") {
          toSave[PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD] = state.durationDisplayMethod;
        }
      }

      if (Object.keys(toSave).length > 0) {
        const browserCache = getBrowserInstance();
        const keys = Object.keys(toSave) as PLUME_CACHE_KEYS[];
        const values = Object.values(toSave);

        browserCache.dispatch(browserActions.setCacheValues(keys, values));
      }

      pendingPersistedKeys.clear();
      persistenceTimer = null;
    }, PERSISTENCE_DELAY_MS);
  };

  const notify = <AppStateProp extends keyof AppState>(key: AppStateProp, prevValue: AppState[AppStateProp]): void => {
    const keyListeners = listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach((listener) => {
        try {
          listener(state[key], prevValue);
        } catch (error) {
          logger(CPL.ERROR, "State listener failed", { key, error });
        }
      });
    }

    globalListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        logger(CPL.ERROR, "Global state listener failed", error);
      }
    });
  };

  const updateState = <AppStateProp extends keyof AppState>(key: AppStateProp, value: AppState[AppStateProp]): void => {
    const prevValue = state[key];

    if (prevValue === value) return;

    state = { ...state, [key]: value };

    notify(key, prevValue);

    if (PERSISTED_KEYS.has(key)) {
      persistState([key]);
    }
  };

  /**
   * Development-only state change logger for debugging.
   * Logs all dispatched actions and resulting state changes.
   */
  const logStateChange = (action: AppAction, prevState: AppState, nextState: AppState): void => {
    // Only log in development builds
    if (process.env.NODE_ENV !== "production") {
      const hasPayload = "payload" in action;

      logger(CPL.DEBUG, `[STORE] ${action.type}${hasPayload ? ` → ${JSON.stringify(action.payload)}` : ""}`);

      // Find what changed
      const nextStateKeys = Object.keys(nextState) as Array<keyof AppState>;
      const changes: Array<{ key: string; from: any; to: any }> = [];
      for (const key of nextStateKeys) {
        if (prevState[key] !== nextState[key]) {
          changes.push({
            key,
            from: prevState[key],
            to: nextState[key],
          });
        }
      }

      if (changes.length > 0) logger(CPL.DEBUG, "[STORE] State changes: " + JSON.stringify(changes));
    }
  };

  const reducer = (action: AppAction): void => {
    switch (action.type) {
      case STORE_ACTIONS.SET_PAGE_TYPE:
        updateState("pageType", action.payload);
        break;
      case STORE_ACTIONS.SET_TRACK_TITLE:
        updateState("trackTitle", action.payload);
        break;
      case STORE_ACTIONS.SET_TRACK_NUMBER:
        updateState("trackNumber", action.payload);
        break;
      case STORE_ACTIONS.SET_VOLUME:
        if (action.payload < 0 || action.payload > 1) {
          logger(CPL.WARN, "Invalid volume value", action.payload);
          return;
        }
        updateState("volume", action.payload);
        break;
      case STORE_ACTIONS.SET_DURATION_DISPLAY_METHOD:
        updateState("durationDisplayMethod", action.payload);
        break;
      case STORE_ACTIONS.SET_CURRENT_TIME:
        updateState("currentTime", action.payload);
        break;
      case STORE_ACTIONS.SET_DURATION:
        updateState("duration", action.payload);
        break;
      case STORE_ACTIONS.SET_IS_PLAYING:
        updateState("isPlaying", action.payload);
        break;
      case STORE_ACTIONS.SET_IS_MUTED:
        updateState("isMuted", action.payload);
        break;
      case STORE_ACTIONS.TOGGLE_MUTE: {
        if (state.isMuted) {
          // Unmute: restore previous volume
          const restoredVolume = state.volumeBeforeMute > 0 ? state.volumeBeforeMute : PLUME_DEFAULTS.savedVolume;
          updateState("volume", restoredVolume);
          updateState("isMuted", false);
        } else {
          // Mute: save current volume and set to 0
          updateState("volumeBeforeMute", state.volume);
          updateState("volume", 0);
          updateState("isMuted", true);
        }
        break;
      }
      case STORE_ACTIONS.SET_IS_FULLSCREEN:
        updateState("isFullscreen", action.payload);
        break;
      case STORE_ACTIONS.RESET_TRANSIENT_STATE:
        updateState("trackTitle", INITIAL_STATE.trackTitle);
        updateState("trackNumber", INITIAL_STATE.trackNumber);
        updateState("duration", INITIAL_STATE.duration);
        updateState("currentTime", INITIAL_STATE.currentTime);
        updateState("isPlaying", INITIAL_STATE.isPlaying);
        updateState("isMuted", INITIAL_STATE.isMuted);
        updateState("volumeBeforeMute", INITIAL_STATE.volumeBeforeMute);
        updateState("isFullscreen", INITIAL_STATE.isFullscreen);
        break;
      default:
        action satisfies never; // Ensure declared all action types are handled
        handleUnknownAction(action);
    }
  };

  const loadPersistedStateThunk = (): Thunk<AppState, AppAction> => async (dispatch) => {
    try {
      const browserCache = getBrowserInstance().getState().cache;
      const keys = [PLUME_CACHE_KEYS.VOLUME, PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD];
      const result = await browserCache.get(keys);

      if (result[PLUME_CACHE_KEYS.VOLUME] !== undefined) {
        const volume = result[PLUME_CACHE_KEYS.VOLUME];
        if (typeof volume === "number") {
          const volumeClamped = Math.max(0, Math.min(1, volume)); // Ensure volume is between 0 and 1
          dispatch(storeActions.setVolume(volumeClamped));

          if (volumeClamped === 0) {
            dispatch(storeActions.setIsMuted(true));
          }
          logger(CPL.INFO, "Volume loaded:", `${Math.round(volumeClamped * 100)}%`);
        }
      }

      if (result[PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD] !== undefined) {
        const method = result[PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD];
        if (method === "duration" || method === "remaining") {
          dispatch(storeActions.setDurationDisplayMethod(method));
          logger(CPL.INFO, "Time display method applied:", method);
        }
      }
    } catch (error) {
      logger(CPL.ERROR, "Failed to load persisted state", error);
    }
  };

  return {
    getState(): Readonly<AppState> {
      return state;
    },

    dispatch(action: AppAction | Thunk<AppState, AppAction>): void {
      // Handle async thunks
      if (typeof action === "function") {
        action(this.dispatch.bind(this), this.getState.bind(this));
        return;
      }

      // Handle regular actions
      const prevState = { ...state };
      reducer(action);
      logStateChange(action, prevState, state);

      // Record scenario entry for time-travel debugging
      scenarioRecorder?.record(action, state);
    },

    subscribe<AppStateProp extends keyof AppState>(
      key: AppStateProp,
      listener: AppStateListener<AppStateProp>
    ): () => void {
      if (!listeners.has(key)) listeners.set(key, new Set());

      listeners.get(key)!.add(listener);

      return () => {
        const keyListeners = listeners.get(key);
        if (keyListeners) {
          keyListeners.delete(listener);
          if (keyListeners.size === 0) {
            listeners.delete(key);
          }
        }
      };
    },

    subscribeAll(listener: (state: AppState) => void): () => void {
      globalListeners.add(listener);

      return () => {
        globalListeners.delete(listener);
      };
    },

    loadPersistedState: async function (): Promise<void> {
      // Use the thunk pattern for async state loading
      this.dispatch(loadPersistedStateThunk());
    },

    computed: {
      formattedElapsed: () => presentFormattedElapsed(state),
      formattedDuration: () => presentFormattedDuration(state),
      progressPercentage: () => presentProgressPercentage(state),
    },

    scenario: {
      undo(): boolean {
        if (!scenarioRecorder) return false;
        const restored = scenarioRecorder.undo(INITIAL_STATE);
        if (!restored) return false;

        const prevState = { ...state };
        state = { ...restored };

        // Notify listeners for every key that changed
        for (const key of Object.keys(state) as Array<keyof AppState>) {
          if (prevState[key] !== state[key]) {
            notify(key, prevState[key]);
          }
        }

        logger(CPL.DEBUG, "[SCENARIO] Undo applied", scenarioRecorder.getScenarioView().cursor);
        return true;
      },

      redo(): boolean {
        if (!scenarioRecorder) return false;
        const restored = scenarioRecorder.redo();
        if (!restored) return false;

        const prevState = { ...state };
        state = { ...restored };

        for (const key of Object.keys(state) as Array<keyof AppState>) {
          if (prevState[key] !== state[key]) {
            notify(key, prevState[key]);
          }
        }

        logger(CPL.DEBUG, "[SCENARIO] Redo applied", scenarioRecorder.getScenarioView().cursor);
        return true;
      },

      replayScenario(toIndex?: number): void {
        if (!scenarioRecorder) return;
        const restored = scenarioRecorder.replayScenario(INITIAL_STATE, toIndex);

        const prevState = { ...state };
        state = { ...restored };

        for (const key of Object.keys(state) as Array<keyof AppState>) {
          if (prevState[key] !== state[key]) {
            notify(key, prevState[key]);
          }
        }

        const view = scenarioRecorder.getScenarioView();
        logger(CPL.DEBUG, `[SCENARIO] Replayed to index ${view.cursor} / ${view.entries.length - 1}`);
      },

      getScenarioView(): ScenarioView<AppState, AppAction> {
        if (!scenarioRecorder) {
          return { entries: [], cursor: -1 };
        }
        return scenarioRecorder.getScenarioView();
      },

      clearScenario(): void {
        scenarioRecorder?.clearScenario();
        logger(CPL.DEBUG, "[SCENARIO] Cleared");
      },
    },
  };
};

export const getStoreInstance = (): AppStateStore => {
  appStoreInstance ??= createAppStateInstance();
  return appStoreInstance;
};
