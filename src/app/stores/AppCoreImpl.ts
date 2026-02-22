import { LocalStorage, PLUME_CACHE_KEYS, PlumeCacheKey } from "../../domain/browser";
import { PLUME_DEFAULTS, TIME_DISPLAY_METHOD, TimeDisplayMethodType } from "../../domain/plume";
import { BcPageType } from "../../domain/ports/bc-player";
import { createScenarioRecorder, IScenarioControls, IScenarioView, Thunk } from "../../domain/store";
import { AppCore, AppCoreListener, CORE_ACTIONS, CoreAction, IAppCore, ICoreActions } from "../../infra/AppCore";
import { meta, PROCESS_ENV } from "../../infra/node";
import { CPL, logger } from "../../shared/logger";
import { presentFormattedDuration, presentFormattedElapsed, presentProgressPercentage } from "../features/presenters";
import { browserActions, getBrowserInstance } from "./BrowserImpl";
import { handleUnknownAction } from "./shared";

export const coreActions: ICoreActions = {
  setPageType: (pageType: BcPageType | null): CoreAction => ({
    type: CORE_ACTIONS.SET_PAGE_TYPE,
    payload: pageType,
  }),
  setTrackTitle: (title: string | null): CoreAction => ({
    type: CORE_ACTIONS.SET_TRACK_TITLE,
    payload: title,
  }),
  setTrackNumber: (number: string | null): CoreAction => ({
    type: CORE_ACTIONS.SET_TRACK_NUMBER,
    payload: number,
  }),
  setDuration: (duration: number): CoreAction => ({
    type: CORE_ACTIONS.SET_DURATION,
    payload: duration,
  }),
  setCurrentTime: (time: number): CoreAction => ({
    type: CORE_ACTIONS.SET_CURRENT_TIME,
    payload: time,
  }),
  setIsPlaying: (isPlaying: boolean): CoreAction => ({
    type: CORE_ACTIONS.SET_IS_PLAYING,
    payload: isPlaying,
  }),
  setDurationDisplayMethod: (method: TimeDisplayMethodType): CoreAction => ({
    type: CORE_ACTIONS.SET_DURATION_DISPLAY_METHOD,
    payload: method,
  }),
  setVolume: (volume: number): CoreAction => ({
    type: CORE_ACTIONS.SET_VOLUME,
    payload: volume,
  }),
  setIsMuted: (isMuted: boolean): CoreAction => ({
    type: CORE_ACTIONS.SET_IS_MUTED,
    payload: isMuted,
  }),
  toggleMute: (): CoreAction => ({
    type: CORE_ACTIONS.TOGGLE_MUTE,
  }),
  setIsFullscreen: (isFullscreen: boolean): CoreAction => ({
    type: CORE_ACTIONS.SET_IS_FULLSCREEN,
    payload: isFullscreen,
  }),
  resetTransientState: (): CoreAction => ({
    type: CORE_ACTIONS.RESET_TRANSIENT_STATE,
  }),
} as const;

const INITIAL_STATE: AppCore = {
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

const PERSISTED_KEYS: ReadonlySet<keyof AppCore> = new Set<keyof AppCore>(["volume", "durationDisplayMethod"]);
const PERSISTENCE_DELAY_MS = 200;

const createAppCoreInstance = (): IAppCore => {
  let state: AppCore = { ...INITIAL_STATE };

  const listeners = new Map<keyof AppCore, Set<AppCoreListener<any>>>();
  const globalListeners = new Set<(state: AppCore) => void>();

  let persistenceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingPersistedKeys = new Set<keyof AppCore>();

  // Scenario recorder for time-travel debugging (test-only)
  const scenarioRecorder: IScenarioControls<AppCore, CoreAction> | null =
    meta.env === PROCESS_ENV.TESTING ? createScenarioRecorder<AppCore, CoreAction>() : null;

  const persistState = (keys: Array<keyof AppCore>): void => {
    // Accumulate all keys that need to be persisted during the debounce window
    keys.forEach((key) => {
      if (PERSISTED_KEYS.has(key)) pendingPersistedKeys.add(key);
    });

    if (persistenceTimer) clearTimeout(persistenceTimer);
    persistenceTimer = setTimeout(() => {
      const toSave: Partial<LocalStorage> = {};

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
        const keys = Object.keys(toSave) as PlumeCacheKey[];
        const values = Object.values(toSave);

        browserCache.dispatch(browserActions.setCacheValues(keys, values));
      }

      pendingPersistedKeys.clear();
      persistenceTimer = null;
    }, PERSISTENCE_DELAY_MS);
  };

  const notify = <AppCoreProp extends keyof AppCore>(key: AppCoreProp, prevValue: AppCore[AppCoreProp]): void => {
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

  const updateState = <AppCoreProp extends keyof AppCore>(key: AppCoreProp, value: AppCore[AppCoreProp]): void => {
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
  const logStateChange = (action: CoreAction, prevState: AppCore, nextState: AppCore): void => {
    // Only log in development builds
    if (meta.env !== PROCESS_ENV.PRODUCTION) {
      const hasPayload = "payload" in action;

      logger(CPL.DEBUG, `[STORE] ${action.type}${hasPayload ? ` → ${JSON.stringify(action.payload)}` : ""}`);

      // Find what changed
      const nextStateKeys = Object.keys(nextState) as Array<keyof AppCore>;
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

  const reducer = (action: CoreAction): void => {
    switch (action.type) {
      case CORE_ACTIONS.SET_PAGE_TYPE:
        updateState("pageType", action.payload);
        break;
      case CORE_ACTIONS.SET_TRACK_TITLE:
        updateState("trackTitle", action.payload);
        break;
      case CORE_ACTIONS.SET_TRACK_NUMBER:
        updateState("trackNumber", action.payload);
        break;
      case CORE_ACTIONS.SET_VOLUME:
        if (action.payload < 0 || action.payload > 1) {
          logger(CPL.WARN, "Invalid volume value", action.payload);
          return;
        }
        updateState("volume", action.payload);
        break;
      case CORE_ACTIONS.SET_DURATION_DISPLAY_METHOD:
        updateState("durationDisplayMethod", action.payload);
        break;
      case CORE_ACTIONS.SET_CURRENT_TIME:
        updateState("currentTime", action.payload);
        break;
      case CORE_ACTIONS.SET_DURATION:
        updateState("duration", action.payload);
        break;
      case CORE_ACTIONS.SET_IS_PLAYING:
        updateState("isPlaying", action.payload);
        break;
      case CORE_ACTIONS.SET_IS_MUTED:
        updateState("isMuted", action.payload);
        break;
      case CORE_ACTIONS.TOGGLE_MUTE: {
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
      case CORE_ACTIONS.SET_IS_FULLSCREEN:
        updateState("isFullscreen", action.payload);
        break;
      case CORE_ACTIONS.RESET_TRANSIENT_STATE:
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

  const loadPersistedStateThunk = (): Thunk<AppCore, CoreAction> => async (dispatch) => {
    try {
      const browserCache = getBrowserInstance().getState().cache;
      const keys = [PLUME_CACHE_KEYS.VOLUME, PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD];
      const result = await browserCache.get(keys);

      if (result[PLUME_CACHE_KEYS.VOLUME] !== undefined) {
        const volume = result[PLUME_CACHE_KEYS.VOLUME];
        if (typeof volume === "number") {
          const volumeClamped = Math.max(0, Math.min(1, volume)); // Ensure volume is between 0 and 1
          dispatch(coreActions.setVolume(volumeClamped));

          if (volumeClamped === 0) {
            dispatch(coreActions.setIsMuted(true));
          }
          logger(CPL.INFO, "Volume loaded:", `${Math.round(volumeClamped * 100)}%`);
        }
      }

      if (result[PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD] !== undefined) {
        const method = result[PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD];
        if (method === "duration" || method === "remaining") {
          dispatch(coreActions.setDurationDisplayMethod(method));
          logger(CPL.INFO, "Time display method applied:", method);
        }
      }
    } catch (error) {
      logger(CPL.ERROR, "Failed to load persisted state", error);
    }
  };

  return {
    getState(): Readonly<AppCore> {
      return state;
    },

    dispatch(action: CoreAction | Thunk<AppCore, CoreAction>): void {
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

    subscribe<AppCoreProp extends keyof AppCore>(key: AppCoreProp, listener: AppCoreListener<AppCoreProp>): () => void {
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

    subscribeAll(listener: (state: AppCore) => void): () => void {
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
        for (const key of Object.keys(state) as Array<keyof AppCore>) {
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

        for (const key of Object.keys(state) as Array<keyof AppCore>) {
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

        for (const key of Object.keys(state) as Array<keyof AppCore>) {
          if (prevState[key] !== state[key]) {
            notify(key, prevState[key]);
          }
        }

        const view = scenarioRecorder.getScenarioView();
        logger(CPL.DEBUG, `[SCENARIO] Replayed to index ${view.cursor} / ${view.entries.length - 1}`);
      },

      getScenarioView(): IScenarioView<AppCore, CoreAction> {
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

let appCoreInstance: IAppCore | null = null;
export const getAppCoreInstance = (): IAppCore => {
  appCoreInstance ??= createAppCoreInstance();
  return appCoreInstance;
};
