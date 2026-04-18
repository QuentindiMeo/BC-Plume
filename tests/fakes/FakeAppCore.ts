import { DEFAULT_HOTKEYS } from "@/domain/hotkeys";
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
  featureFlags: { ...PLUME_DEFAULTS.featureFlags },

  pageType: null,
  trackTitle: null,
  trackNumber: null,
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  isMuted: false,
  volumeBeforeMute: 0,
  isFullscreen: false,
};

/**
 * In-memory IAppCore for tests. Applies a minimal reducer so tests can assert
 * on observable state rather than on dispatch call arguments.
 */
export class FakeAppCore implements IAppCore {
  private state: AppCore;

  constructor(overrides: Partial<AppCore> = {}) {
    this.state = { ...DEFAULT_STATE, ...overrides };
  }

  getState(): Readonly<AppCore> {
    return this.state;
  }

  dispatch(action: CoreAction | Thunk<AppCore, CoreAction>): void {
    if (typeof action === "function") return;
    switch (action.type) {
      case CORE_ACTIONS.SET_CURRENT_TIME:
        this.state = { ...this.state, currentTime: action.payload };
        break;
      case CORE_ACTIONS.SET_VOLUME:
        this.state = { ...this.state, volume: action.payload };
        break;
      case CORE_ACTIONS.SET_IS_MUTED:
        this.state = { ...this.state, isMuted: action.payload };
        break;
      case CORE_ACTIONS.SET_IS_PLAYING:
        this.state = { ...this.state, isPlaying: action.payload };
        break;
      case CORE_ACTIONS.SET_DURATION_DISPLAY_METHOD:
        this.state = { ...this.state, durationDisplayMethod: action.payload };
        break;
      case CORE_ACTIONS.SET_PLAYBACK_SPEED:
        this.state = { ...this.state, playbackSpeed: action.payload };
        break;
      case CORE_ACTIONS.SET_PAGE_TYPE:
        this.state = { ...this.state, pageType: action.payload };
        break;
      case CORE_ACTIONS.SET_LOOP_MODE:
        this.state = { ...this.state, loopMode: action.payload };
        break;
      case CORE_ACTIONS.SET_TRACK_TITLE:
        this.state = { ...this.state, trackTitle: action.payload };
        break;
      case CORE_ACTIONS.SET_TRACK_NUMBER:
        this.state = { ...this.state, trackNumber: action.payload };
        break;
    }
  }

  subscribe<K extends keyof AppCore>(_key: K, _listener: AppCoreListener<K>): () => void {
    return () => {};
  }

  subscribeAll(_listener: (state: AppCore) => void): () => void {
    return () => {};
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
