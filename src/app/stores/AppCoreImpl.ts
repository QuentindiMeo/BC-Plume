import { getMusicPlayerInstance } from "@/app/stores/adapters";
import { getBrowserInstance } from "@/app/stores/BrowserImpl";
import { handleUnknownAction } from "@/app/stores/shared";
import { LocalStorage, PLUME_CACHE_KEYS, PlumeCacheKey } from "@/domain/browser";
import { DEFAULT_HOTKEYS, HotkeyAction, KeyBinding, KeyBindingMap } from "@/domain/hotkeys";
import {
  assertBoundedInteger,
  LOOP_MODE,
  LOOP_MODE_CYCLE,
  type LoopModeType,
  PLUME_DEFAULTS,
  SEEK_JUMP_DURATION_MAX,
  SEEK_JUMP_DURATION_MIN,
  TIME_DISPLAY_METHOD,
  type TimeDisplayMethodType,
  TRACK_RESTART_THRESHOLD_MAX,
  TRACK_RESTART_THRESHOLD_MIN,
  VOLUME_HOTKEY_STEP_MAX,
  VOLUME_HOTKEY_STEP_MIN,
} from "@/domain/plume";
import { AppCore, AppCoreListener, CORE_ACTIONS, CoreAction, coreActions, IAppCore } from "@/domain/ports/app-core";
import { browserActions } from "@/domain/ports/browser";
import { createScenarioRecorder, IScenarioControls, IScenarioView, Thunk } from "@/domain/store";
import { meta, PROCESS_ENV } from "@/infra/node";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";
import { presentFormattedDuration, presentFormattedElapsed, presentProgressPercentage } from "@/shared/presenters";

const INITIAL_STATE: AppCore = {
  pageType: null,
  trackTitle: null,
  trackNumber: null,
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION,
  loopMode: PLUME_DEFAULTS.loopMode,
  volume: PLUME_DEFAULTS.savedVolume,
  isMuted: false,
  volumeBeforeMute: PLUME_DEFAULTS.savedVolume,
  isFullscreen: false,

  hotkeyBindings: { ...DEFAULT_HOTKEYS },
  seekJumpDuration: PLUME_DEFAULTS.seekJumpDuration,
  volumeHotkeyStep: PLUME_DEFAULTS.volumeHotkeyStep,
  trackRestartThreshold: PLUME_DEFAULTS.trackRestartThreshold,
  featureFlags: { ...PLUME_DEFAULTS.featureFlags },
};

const PERSISTED_KEYS: ReadonlySet<keyof AppCore> = new Set<keyof AppCore>([
  "durationDisplayMethod",
  "loopMode",
  "volume",

  "hotkeyBindings",
  "seekJumpDuration",
  "volumeHotkeyStep",
  "trackRestartThreshold",
  "featureFlags",
]);
const PERSISTENCE_DELAY_MS = 200;

const areCachedHotkeyBindingsInvalid = (value: any): boolean =>
  value !== undefined && (typeof value !== "object" || value === null || Array.isArray(value));
const isPlumeDurationDisplayMethod = (value: any): value is TimeDisplayMethodType =>
  Object.values(TIME_DISPLAY_METHOD).includes(value);
const isPlumeLoopMode = (value: any): value is LoopModeType => Object.values(LOOP_MODE).includes(value);

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
        } else if (key === "loopMode") {
          toSave[PLUME_CACHE_KEYS.LOOP_MODE] = state.loopMode;
        } else if (key === "hotkeyBindings") {
          toSave[PLUME_CACHE_KEYS.HOTKEY_BINDINGS] = state.hotkeyBindings;
        } else if (key === "seekJumpDuration") {
          toSave[PLUME_CACHE_KEYS.SEEK_JUMP_DURATION] = state.seekJumpDuration;
        } else if (key === "volumeHotkeyStep") {
          toSave[PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP] = state.volumeHotkeyStep;
        } else if (key === "trackRestartThreshold") {
          toSave[PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD] = state.trackRestartThreshold;
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
          logger(CPL.WARN, getString("WARN__VOLUME__INVALID_VALUE"), [action.payload]);
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
      case CORE_ACTIONS.SET_HOTKEY_BINDINGS:
        updateState("hotkeyBindings", action.payload);
        break;
      case CORE_ACTIONS.SET_SEEK_JUMP_DURATION:
        try {
          assertBoundedInteger(action.payload, SEEK_JUMP_DURATION_MIN, SEEK_JUMP_DURATION_MAX);
          updateState("seekJumpDuration", action.payload);
        } catch {
          logger(CPL.WARN, getString("WARN__SEEK_JUMP_DURATION__INVALID_VALUE"));
          const defaultSeekJumpDuration = PLUME_DEFAULTS.seekJumpDuration;
          updateState("seekJumpDuration", defaultSeekJumpDuration);
          return;
        }
        break;
      case CORE_ACTIONS.SET_VOLUME_HOTKEY_STEP:
        try {
          assertBoundedInteger(action.payload, VOLUME_HOTKEY_STEP_MIN, VOLUME_HOTKEY_STEP_MAX);
          updateState("volumeHotkeyStep", action.payload);
        } catch {
          logger(CPL.WARN, getString("WARN__VOLUME_HOTKEY_STEP__INVALID_VALUE"));
          const defaultVolumeStep = PLUME_DEFAULTS.volumeHotkeyStep;
          updateState("volumeHotkeyStep", defaultVolumeStep);
          return;
        }
        break;
      case CORE_ACTIONS.SET_TRACK_RESTART_THRESHOLD:
        try {
          assertBoundedInteger(action.payload, TRACK_RESTART_THRESHOLD_MIN, TRACK_RESTART_THRESHOLD_MAX);
          updateState("trackRestartThreshold", action.payload);
        } catch {
          logger(CPL.WARN, getString("WARN__TRACK_RESTART_THRESHOLD__INVALID_VALUE"));
          const defaultTrackRestartThreshold = PLUME_DEFAULTS.trackRestartThreshold;
          updateState("trackRestartThreshold", defaultTrackRestartThreshold);
        }
        break;
      case CORE_ACTIONS.SET_LOOP_MODE:
        updateState("loopMode", action.payload);
        break;
      case CORE_ACTIONS.CYCLE_LOOP_MODE: {
        const currentIndex = LOOP_MODE_CYCLE.indexOf(state.loopMode);
        const nextIndex = (currentIndex + 1) % LOOP_MODE_CYCLE.length;
        const nextMode = LOOP_MODE_CYCLE[nextIndex];

        // If current page is track, skip to track loop (collection loop doesn't make sense on track page)
        if (state.pageType === "track" && nextMode === LOOP_MODE.COLLECTION) {
          updateState("loopMode", LOOP_MODE.TRACK);
        } else {
          updateState("loopMode", nextMode);
        }
        break;
      }
      case CORE_ACTIONS.SET_FEATURE_FLAGS:
        updateState("featureFlags", { ...PLUME_DEFAULTS.featureFlags, ...action.payload });
        break;
      default:
        action satisfies never; // Ensure declared all action types are handled
        handleUnknownAction(action);
    }
  };

  const loadPersistedStateThunk = (): Thunk<AppCore, CoreAction> => async (dispatch) => {
    try {
      const browserCache = getBrowserInstance().getState().cache;
      const keys = [
        PLUME_CACHE_KEYS.LOOP_MODE,
        PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD,
        PLUME_CACHE_KEYS.VOLUME,
        PLUME_CACHE_KEYS.HOTKEY_BINDINGS,
        PLUME_CACHE_KEYS.SEEK_JUMP_DURATION,
        PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP,
        PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD,
        PLUME_CACHE_KEYS.FEATURE_FLAGS,
      ];
      const result = await browserCache.get(keys);

      if (result[PLUME_CACHE_KEYS.VOLUME] !== undefined) {
        const isValidValue = typeof result[PLUME_CACHE_KEYS.VOLUME] === "number";
        const cachedVolume = isValidValue ? result[PLUME_CACHE_KEYS.VOLUME] : PLUME_DEFAULTS.savedVolume;

        const clampedVolume = Math.max(0, Math.min(1, cachedVolume));
        dispatch(coreActions.setVolume(clampedVolume));

        if (clampedVolume === 0) {
          dispatch(coreActions.setIsMuted(true));
        }
        logger(CPL.INFO, getString("INFO__VOLUME__LOADED"), [`${Math.round(clampedVolume * 100)}%`]);
      }

      if (result[PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD] !== undefined) {
        const isValidValue = isPlumeDurationDisplayMethod(result[PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD]);
        const cachedMethod = isValidValue
          ? result[PLUME_CACHE_KEYS.DURATION_DISPLAY_METHOD]
          : PLUME_DEFAULTS.durationDisplayMethod;

        dispatch(coreActions.setDurationDisplayMethod(cachedMethod));
        logger(CPL.INFO, getString("INFO__DURATION_DISPLAY_METHOD__APPLIED", [cachedMethod]));
      }

      if (result[PLUME_CACHE_KEYS.LOOP_MODE] !== undefined) {
        const isValidValue = isPlumeLoopMode(result[PLUME_CACHE_KEYS.LOOP_MODE]);
        const cachedMode = isValidValue ? result[PLUME_CACHE_KEYS.LOOP_MODE] : PLUME_DEFAULTS.loopMode;
        let inferredLoopMode = cachedMode;

        if (state.pageType === "track" && cachedMode === LOOP_MODE.COLLECTION) {
          // Collection loop doesn't make sense on track page - treat as TRACK loop
          inferredLoopMode = LOOP_MODE.TRACK;
          logger(CPL.INFO, getString("INFO__LOOP_MODE__COERCED"));
        }
        dispatch(coreActions.setLoopMode(inferredLoopMode));

        const musicPlayer = getMusicPlayerInstance();
        musicPlayer.setLoop(inferredLoopMode === LOOP_MODE.TRACK);
      }

      const rawBindings = result[PLUME_CACHE_KEYS.HOTKEY_BINDINGS];
      if (areCachedHotkeyBindingsInvalid(rawBindings)) {
        logger(CPL.WARN, getString("WARN__HOTKEY_BINDINGS__INVALID_CACHE"));
        // Overwrite invalid cached bindings with defaults so future loads see a valid value
        const defaultBindings = { ...DEFAULT_HOTKEYS };
        await browserCache.set({ [PLUME_CACHE_KEYS.HOTKEY_BINDINGS]: defaultBindings });
        dispatch(coreActions.setHotkeyBindings(defaultBindings));
      } else {
        const storedBindings = rawBindings as KeyBindingMap | undefined;
        if (storedBindings) {
          // Stored bindings override defaults; actions absent from storage keep their default binding
          const resolved = Object.fromEntries(
            (Object.keys(DEFAULT_HOTKEYS) as HotkeyAction[]).map((action) => [
              action,
              storedBindings[action] ?? DEFAULT_HOTKEYS[action],
            ])
          ) as Record<HotkeyAction, KeyBinding>;
          dispatch(coreActions.setHotkeyBindings(resolved));
        }
      }
      if (result[PLUME_CACHE_KEYS.SEEK_JUMP_DURATION] !== undefined) {
        const value = result[PLUME_CACHE_KEYS.SEEK_JUMP_DURATION];
        try {
          assertBoundedInteger(value, SEEK_JUMP_DURATION_MIN, SEEK_JUMP_DURATION_MAX);
          dispatch(coreActions.setSeekJumpDuration(value));
          logger(CPL.INFO, getString("INFO__SEEK_JUMP_DURATION__LOADED"), `${value}s`);
        } catch {
          logger(CPL.WARN, getString("WARN__SEEK_JUMP_DURATION__INVALID_VALUE"));
          const defaultSeekJumpDuration = PLUME_DEFAULTS.seekJumpDuration;
          dispatch(coreActions.setSeekJumpDuration(defaultSeekJumpDuration));
        }
      }

      if (result[PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP] !== undefined) {
        const value = result[PLUME_CACHE_KEYS.VOLUME_HOTKEY_STEP];
        try {
          assertBoundedInteger(value, VOLUME_HOTKEY_STEP_MIN, VOLUME_HOTKEY_STEP_MAX);
          dispatch(coreActions.setVolumeHotkeyStep(value));
          logger(CPL.INFO, getString("INFO__VOLUME_HOTKEY_STEP__LOADED"), `${value}%`);
        } catch {
          logger(CPL.WARN, getString("WARN__VOLUME_HOTKEY_STEP__INVALID_VALUE"));
          const defaultVolumeStep = PLUME_DEFAULTS.volumeHotkeyStep;
          dispatch(coreActions.setVolumeHotkeyStep(defaultVolumeStep));
        }
      }

      if (result[PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD] !== undefined) {
        const value = result[PLUME_CACHE_KEYS.TRACK_RESTART_THRESHOLD];
        try {
          assertBoundedInteger(value, TRACK_RESTART_THRESHOLD_MIN, TRACK_RESTART_THRESHOLD_MAX);
          dispatch(coreActions.setTrackRestartThreshold(value));
          logger(CPL.INFO, getString("INFO__TRACK_RESTART_THRESHOLD__LOADED"), `${value}s`);
        } catch {
          logger(CPL.WARN, getString("WARN__TRACK_RESTART_THRESHOLD__INVALID_VALUE"));
          const defaultThreshold = PLUME_DEFAULTS.trackRestartThreshold;
          dispatch(coreActions.setTrackRestartThreshold(defaultThreshold));
        }
      }

      const storedFlags = result[PLUME_CACHE_KEYS.FEATURE_FLAGS];
      if (storedFlags !== undefined && typeof storedFlags === "object" && storedFlags !== null) {
        dispatch(coreActions.setFeatureFlags(storedFlags));
      }
    } catch (error) {
      logger(CPL.ERROR, getString("ERROR__STATE__LOAD_FAILED"), error);
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
      await loadPersistedStateThunk()(this.dispatch.bind(this), this.getState.bind(this));
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

export { createAppCoreInstance };

let appCoreInstance: IAppCore | null = null;
export const getAppCoreInstance = (): IAppCore => {
  appCoreInstance ??= createAppCoreInstance();
  return appCoreInstance;
};
