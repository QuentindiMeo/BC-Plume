import { BcPageType, TIME_DISPLAY_METHOD, TimeDisplayMethodType } from "../domain/bandcamp";
import { PLUME_CACHE_KEYS, PLUME_DEFAULTS } from "../domain/plume";
import { Action, handleUnknownAction, Listener, Store } from "../domain/store";
import { CPL, logger } from "../features/logger";
import { BROWSER_ACTION_TYPES, getBrowserInstance } from "./BrowserImpl";

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

export enum STORE_ACTION_TYPES {
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
  | Action<STORE_ACTION_TYPES.SET_PAGE_TYPE, BcPageType | null>
  | Action<STORE_ACTION_TYPES.SET_TRACK_TITLE, string | null>
  | Action<STORE_ACTION_TYPES.SET_TRACK_NUMBER, string | null>
  | Action<STORE_ACTION_TYPES.SET_DURATION, number>
  | Action<STORE_ACTION_TYPES.SET_CURRENT_TIME, number>
  | Action<STORE_ACTION_TYPES.SET_IS_PLAYING, boolean>
  | Action<STORE_ACTION_TYPES.SET_DURATION_DISPLAY_METHOD, TimeDisplayMethodType>
  | Action<STORE_ACTION_TYPES.SET_VOLUME, number>
  | Action<STORE_ACTION_TYPES.SET_IS_MUTED, boolean>
  | Action<STORE_ACTION_TYPES.TOGGLE_MUTE>
  | Action<STORE_ACTION_TYPES.SET_IS_FULLSCREEN, boolean>
  | Action<STORE_ACTION_TYPES.RESET_TRANSIENT_STATE>;

export type AppStateListener<K extends keyof AppState = keyof AppState> = Listener<AppState, K>;

const PERSISTED_KEYS: ReadonlySet<keyof AppState> = new Set<keyof AppState>(["volume", "durationDisplayMethod"]);
const PERSISTENCE_DELAY_MS = 200;

interface AppStateStore extends Store<AppState, AppAction> {
  subscribe<K extends keyof AppState>(key: K, listener: AppStateListener<K>): () => void;
  subscribeAll(listener: (state: AppState) => void): () => void;
  loadPersistedState(): Promise<void>;
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

        browserCache.dispatch({
          type: BROWSER_ACTION_TYPES.SET_CACHE_VALUES,
          payload: { keys, values },
        });
      }

      pendingPersistedKeys.clear();
      persistenceTimer = null;
    }, PERSISTENCE_DELAY_MS);
  };

  const notify = <K extends keyof AppState>(key: K, prevValue: AppState[K]): void => {
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

  const updateState = <K extends keyof AppState>(key: K, value: AppState[K]): void => {
    const prevValue = state[key];

    if (prevValue === value) return;

    state = { ...state, [key]: value };

    notify(key, prevValue);

    if (PERSISTED_KEYS.has(key)) {
      persistState([key]);
    }
  };

  const reducer = (action: AppAction): void => {
    switch (action.type) {
      case STORE_ACTION_TYPES.SET_PAGE_TYPE:
        updateState("pageType", action.payload);
        break;
      case STORE_ACTION_TYPES.SET_TRACK_TITLE:
        updateState("trackTitle", action.payload);
        break;
      case STORE_ACTION_TYPES.SET_TRACK_NUMBER:
        updateState("trackNumber", action.payload);
        break;
      case STORE_ACTION_TYPES.SET_VOLUME:
        if (action.payload < 0 || action.payload > 1) {
          logger(CPL.WARN, "Invalid volume value", action.payload);
          return;
        }
        updateState("volume", action.payload);
        break;
      case STORE_ACTION_TYPES.SET_DURATION_DISPLAY_METHOD:
        updateState("durationDisplayMethod", action.payload);
        break;
      case STORE_ACTION_TYPES.SET_CURRENT_TIME:
        updateState("currentTime", action.payload);
        break;
      case STORE_ACTION_TYPES.SET_DURATION:
        updateState("duration", action.payload);
        break;
      case STORE_ACTION_TYPES.SET_IS_PLAYING:
        updateState("isPlaying", action.payload);
        break;
      case STORE_ACTION_TYPES.SET_IS_MUTED:
        updateState("isMuted", action.payload);
        break;
      case STORE_ACTION_TYPES.TOGGLE_MUTE: {
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
      case STORE_ACTION_TYPES.SET_IS_FULLSCREEN:
        updateState("isFullscreen", action.payload);
        break;
      case STORE_ACTION_TYPES.RESET_TRANSIENT_STATE:
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

  const loadPersistedState = async (store: AppStateStore): Promise<void> => {
    try {
      const browserCache = getBrowserInstance().getState().cache;
      const keys = [PLUME_CACHE_KEYS.VOLUME, PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD];
      const result = await browserCache.get(keys);

      if (result[PLUME_CACHE_KEYS.VOLUME] !== undefined) {
        const volume = result[PLUME_CACHE_KEYS.VOLUME];
        if (typeof volume === "number") {
          const volumeClamped = Math.max(0, Math.min(1, volume)); // Ensure volume is between 0 and 1
          store.dispatch({ type: STORE_ACTION_TYPES.SET_VOLUME, payload: volumeClamped });

          if (volumeClamped === 0) {
            store.dispatch({ type: STORE_ACTION_TYPES.SET_IS_MUTED, payload: true });
          }
          logger(CPL.INFO, "Volume loaded:", `${Math.round(volumeClamped * 100)}%`);
        }
      }

      if (result[PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD] !== undefined) {
        const method = result[PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD];
        if (method === "duration" || method === "remaining") {
          store.dispatch({ type: STORE_ACTION_TYPES.SET_DURATION_DISPLAY_METHOD, payload: method });
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

    dispatch(action: AppAction): void {
      reducer(action);
    },

    subscribe<K extends keyof AppState>(key: K, listener: AppStateListener<K>): () => void {
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
      await loadPersistedState(this);
    },
  };
};

export const getStoreInstance = (): AppStateStore => {
  appStoreInstance ??= createAppStateInstance();
  return appStoreInstance;
};
