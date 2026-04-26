import { DEFAULT_HOTKEYS } from "@/domain/hotkeys";
import type { FeatureFlags } from "@/domain/plume";
import { PLUME_DEFAULTS } from "@/domain/plume";
import type { AppCore, AppCoreListener, CoreAction, IAppCore } from "@/domain/ports/app-core";
import { CORE_ACTIONS } from "@/domain/ports/app-core";
import type { Thunk } from "@/domain/store";

const DEFAULT_STATE: AppCore = {
  durationDisplayMethod: PLUME_DEFAULTS.durationDisplayMethod,
  playbackSpeed: PLUME_DEFAULTS.playbackSpeed,
  loopMode: PLUME_DEFAULTS.loopMode,
  volume: PLUME_DEFAULTS.savedVolume,

  seekJumpDuration: PLUME_DEFAULTS.seekJumpDuration,
  volumeHotkeyStep: PLUME_DEFAULTS.volumeHotkeyStep,
  trackRestartThreshold: PLUME_DEFAULTS.trackRestartThreshold,
  hotkeyBindings: DEFAULT_HOTKEYS,
  featureFlags: { ...PLUME_DEFAULTS.featureFlags } as FeatureFlags,

  pageType: null,
  trackTitle: null,
  trackNumber: null,
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  isMuted: false,
  volumeBeforeMute: 0,
  isFullscreen: false,
  trackBpms: {},
};

/**
 * In-memory IAppCore for tests. Applies a minimal reducer so tests can assert
 * on observable state rather than on dispatch call arguments.
 * Subscriber notifications are supported: listeners registered via subscribe()
 * are called whenever the corresponding key changes via dispatch().
 */
export class FakeAppCore implements IAppCore {
  private state: AppCore;
  private listeners = new Map<keyof AppCore, Set<AppCoreListener<any>>>();
  private globalListeners = new Set<(state: AppCore) => void>();

  constructor(overrides: Partial<AppCore> = {}) {
    this.state = { ...DEFAULT_STATE, ...overrides };
  }

  getState(): Readonly<AppCore> {
    return this.state;
  }

  private updateState<K extends keyof AppCore>(key: K, value: AppCore[K]): void {
    const prevValue = this.state[key];
    if (prevValue === value) return;
    this.state = { ...this.state, [key]: value };
    const keyListeners = this.listeners.get(key);
    if (keyListeners) keyListeners.forEach((l) => l(this.state[key], prevValue));
    this.globalListeners.forEach((l) => l(this.state));
  }

  dispatch(action: CoreAction | Thunk<AppCore, CoreAction>): void {
    if (typeof action === "function") return;
    switch (action.type) {
      case CORE_ACTIONS.SET_CURRENT_TIME:
        this.updateState("currentTime", action.payload);
        break;
      case CORE_ACTIONS.SET_VOLUME:
        this.updateState("volume", action.payload);
        break;
      case CORE_ACTIONS.SET_IS_MUTED:
        this.updateState("isMuted", action.payload);
        break;
      case CORE_ACTIONS.SET_IS_PLAYING:
        this.updateState("isPlaying", action.payload);
        break;
      case CORE_ACTIONS.SET_DURATION_DISPLAY_METHOD:
        this.updateState("durationDisplayMethod", action.payload);
        break;
      case CORE_ACTIONS.SET_PLAYBACK_SPEED:
        this.updateState("playbackSpeed", action.payload);
        break;
      case CORE_ACTIONS.SET_PAGE_TYPE:
        this.updateState("pageType", action.payload);
        break;
      case CORE_ACTIONS.SET_LOOP_MODE:
        this.updateState("loopMode", action.payload);
        break;
      case CORE_ACTIONS.SET_TRACK_TITLE:
        this.updateState("trackTitle", action.payload);
        break;
      case CORE_ACTIONS.SET_TRACK_NUMBER:
        this.updateState("trackNumber", action.payload);
        break;
      case CORE_ACTIONS.SET_FEATURE_FLAGS:
        this.updateState("featureFlags", { ...PLUME_DEFAULTS.featureFlags, ...action.payload });
        break;
      case CORE_ACTIONS.SET_TRACK_BPM_LOADING:
        this.updateState("trackBpms", {
          ...this.state.trackBpms,
          [action.payload]: { bpm: null, loading: true, error: false },
        });
        break;
      case CORE_ACTIONS.SET_TRACK_BPM_SUCCESS:
        this.updateState("trackBpms", {
          ...this.state.trackBpms,
          [action.payload.trackUrl]: { bpm: action.payload.bpm, loading: false, error: false },
        });
        break;
      case CORE_ACTIONS.SET_TRACK_BPM_ERROR:
        this.updateState("trackBpms", {
          ...this.state.trackBpms,
          [action.payload]: { bpm: null, loading: false, error: true },
        });
        break;
      case CORE_ACTIONS.CLEAR_TRACK_BPMS:
        this.updateState("trackBpms", {});
        break;
    }
  }

  subscribe<K extends keyof AppCore>(key: K, listener: AppCoreListener<K>): () => void {
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(listener);
    return () => {
      const set = this.listeners.get(key);
      if (set) {
        set.delete(listener);
        if (set.size === 0) this.listeners.delete(key);
      }
    };
  }

  subscribeAll(listener: (state: AppCore) => void): () => void {
    this.globalListeners.add(listener);
    return () => {
      this.globalListeners.delete(listener);
    };
  }

  async loadPersistedState(): Promise<void> {}

  computed = {
    formattedElapsed: () => "0:00",
    formattedDuration: () => "0:00",
    progressPercentage: () => 0,
  };

  scenario = {
    undo: () => false,
    redo: () => false,
    replayScenario: (_toIndex?: number) => {},
    getScenarioView: () => ({ entries: [] as never[], cursor: -1 }),
    clearScenario: () => {},
  };
}
