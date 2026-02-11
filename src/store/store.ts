import { PLUME_DEF } from "../constants";
import { PLUME_CACHE_KEYS, TIME_DISPLAY_METHOD, TimeDisplayMethodType } from "../types";
import { browserCache } from "../utils/browser";
import { getString } from "../utils/i18n";
import { CPL, logger } from "../utils/logger";
import { handleUnknownAction } from "../utils/typescript";

export interface PersistedState {
  volume: number;
  durationDisplayMethod: TimeDisplayMethodType;
}

export interface TransientState {
  trackTitle: string | null;
  trackNumber: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isMuted: boolean;
  volumeBeforeMute: number;
  isFullscreen: boolean;
}

export interface AppState extends PersistedState, TransientState {}

export enum ACTION_TYPES {
  SET_TRACK_TITLE,
  SET_TRACK_NUMBER,
  SET_DURATION,
  SET_CURRENT_TIME,
  SET_IS_PLAYING,
  SET_DURATION_DISPLAY_METHOD,
  SET_VOLUME,
  SET_IS_MUTED,
  UPDATE_PLAYBACK_PROGRESS,
  TOGGLE_MUTE,
  SET_IS_FULLSCREEN,
  RESET_TRANSIENT_STATE,
}

export type Action =
  | { type: ACTION_TYPES.SET_TRACK_TITLE; payload: string | null }
  | { type: ACTION_TYPES.SET_TRACK_NUMBER; payload: string | null }
  | { type: ACTION_TYPES.SET_DURATION; payload: number }
  | { type: ACTION_TYPES.SET_CURRENT_TIME; payload: number }
  | { type: ACTION_TYPES.SET_IS_PLAYING; payload: boolean }
  | { type: ACTION_TYPES.SET_DURATION_DISPLAY_METHOD; payload: TimeDisplayMethodType }
  | { type: ACTION_TYPES.SET_VOLUME; payload: number }
  | { type: ACTION_TYPES.SET_IS_MUTED; payload: boolean }
  | { type: ACTION_TYPES.UPDATE_PLAYBACK_PROGRESS; payload: { currentTime: number; duration: number } }
  | { type: ACTION_TYPES.TOGGLE_MUTE }
  | { type: ACTION_TYPES.SET_IS_FULLSCREEN; payload: boolean }
  | { type: ACTION_TYPES.RESET_TRANSIENT_STATE };

export type StateListener<K extends keyof AppState> = (value: AppState[K], prevValue: AppState[K]) => void;

export interface Store {
  getState(): Readonly<AppState>;
  dispatch(action: Action): void;
  subscribe<K extends keyof AppState>(key: K, listener: StateListener<K>): () => void;
  subscribeAll(listener: (state: AppState) => void): () => void;
}

const INITIAL_STATE: AppState = {
  trackTitle: null,
  trackNumber: null,
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION,
  volume: PLUME_DEF.savedVolume,
  isMuted: false,
  volumeBeforeMute: PLUME_DEF.savedVolume,
  isFullscreen: false,
};

const PERSISTED_KEYS: ReadonlySet<keyof AppState> = new Set<keyof AppState>(["volume", "durationDisplayMethod"]);

const PERSISTENCE_DELAY_MS = 200;

export function createStore(): Store {
  let state: AppState = { ...INITIAL_STATE };

  const listeners = new Map<keyof AppState, Set<StateListener<any>>>();
  const globalListeners = new Set<(state: AppState) => void>();

  let persistenceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingPersistedKeys = new Set<keyof AppState>();

  function persistState(keys: Array<keyof AppState>): void {
    // Accumulate all keys that need to be persisted during the debounce window
    keys.forEach((key) => {
      if (PERSISTED_KEYS.has(key)) pendingPersistedKeys.add(key);
    });

    if (persistenceTimer) clearTimeout(persistenceTimer);
    persistenceTimer = setTimeout(() => {
      const toSave: Record<string, any> = {};

      // Persist all pending keys that accumulated during debounce window
      for (const key of pendingPersistedKeys) {
        if (key === "volume") {
          toSave[PLUME_CACHE_KEYS.VOLUME] = state.volume;
        } else if (key === "durationDisplayMethod") {
          toSave[PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD] = state.durationDisplayMethod;
        }
      }

      if (Object.keys(toSave).length > 0) {
        browserCache
          .set(toSave)
          .then(() => {
            logger(CPL.DEBUG, getString("DEBUG__STATE__PERSISTED"), Object.keys(toSave));
          })
          .catch((error) => {
            logger(CPL.ERROR, getString("ERROR__STATE__PERSIST_FAILED"), error);
          });
      }

      pendingPersistedKeys.clear();
      persistenceTimer = null;
    }, PERSISTENCE_DELAY_MS);
  }

  function notify<K extends keyof AppState>(key: K, prevValue: AppState[K]): void {
    const keyListeners = listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach((listener) => {
        try {
          listener(state[key], prevValue);
        } catch (error) {
          logger(CPL.ERROR, getString("ERROR__STATE__LISTENER_FAILED"), { key, error });
        }
      });
    }

    globalListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        logger(CPL.ERROR, getString("ERROR__STATE__GLOBAL_LISTENER_FAILED"), error);
      }
    });
  }

  function updateState<K extends keyof AppState>(key: K, value: AppState[K]): void {
    const prevValue = state[key];

    if (prevValue === value) return;

    state = { ...state, [key]: value };

    notify(key, prevValue);

    if (PERSISTED_KEYS.has(key)) {
      persistState([key]);
    }
  }

  function reducer(action: Action): void {
    switch (action.type) {
      case ACTION_TYPES.SET_TRACK_TITLE:
        updateState("trackTitle", action.payload);
        break;

      case ACTION_TYPES.SET_TRACK_NUMBER:
        updateState("trackNumber", action.payload);
        break;

      case ACTION_TYPES.SET_VOLUME:
        if (action.payload < 0 || action.payload > 1) {
          logger(CPL.WARN, getString("WARN__VOLUME__INVALID_VALUE"), action.payload);
          return;
        }
        updateState("volume", action.payload);
        break;

      case ACTION_TYPES.SET_DURATION_DISPLAY_METHOD:
        updateState("durationDisplayMethod", action.payload);
        break;

      case ACTION_TYPES.SET_CURRENT_TIME:
        updateState("currentTime", action.payload);
        break;

      case ACTION_TYPES.SET_DURATION:
        updateState("duration", action.payload);
        break;

      case ACTION_TYPES.SET_IS_PLAYING:
        updateState("isPlaying", action.payload);
        break;

      case ACTION_TYPES.SET_IS_MUTED:
        updateState("isMuted", action.payload);
        break;

      case ACTION_TYPES.TOGGLE_MUTE: {
        if (state.isMuted) {
          // Unmute: restore previous volume
          const restoredVolume = state.volumeBeforeMute > 0 ? state.volumeBeforeMute : PLUME_DEF.savedVolume;
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

      case ACTION_TYPES.SET_IS_FULLSCREEN:
        updateState("isFullscreen", action.payload);
        break;

      case ACTION_TYPES.UPDATE_PLAYBACK_PROGRESS:
        updateState("currentTime", action.payload.currentTime);
        updateState("duration", action.payload.duration);
        break;

      case ACTION_TYPES.RESET_TRANSIENT_STATE:
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
  }

  return {
    getState(): Readonly<AppState> {
      return state;
    },

    dispatch(action: Action): void {
      reducer(action);
    },

    subscribe<K extends keyof AppState>(key: K, listener: StateListener<K>): () => void {
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
  };
}
