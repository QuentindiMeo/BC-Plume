import { HotkeyAction, KeyBinding } from "@/domain/hotkeys";
import { FeatureFlags, LoopModeType, TimeDisplayMethodType } from "@/domain/plume";
import { BcPageType } from "@/domain/ports/bc-player";
import { IAction, IScenarioView, IStore } from "@/domain/store";

export interface AppPersistedState {
  durationDisplayMethod: TimeDisplayMethodType;
  loopMode: LoopModeType;
  volume: number;
  playbackSpeed: number;

  hotkeyBindings: Record<HotkeyAction, KeyBinding>;
  seekJumpDuration: number;
  volumeHotkeyStep: number;
  trackRestartThreshold: number;
  featureFlags: FeatureFlags;
}

export interface TrackBpmEntry {
  bpm: number | null;
  loading: boolean;
  error: boolean;
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
  trackBpms: Record<string, TrackBpmEntry>;
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
  SET_PLAYBACK_SPEED = "SET_PLAYBACK_SPEED",
  SET_LOOP_MODE = "SET_LOOP_MODE",
  CYCLE_LOOP_MODE = "CYCLE_LOOP_MODE",
  SET_IS_MUTED = "SET_IS_MUTED",
  TOGGLE_MUTE = "TOGGLE_MUTE",
  SET_VOLUME = "SET_VOLUME",
  SET_IS_FULLSCREEN = "SET_IS_FULLSCREEN",

  SET_SEEK_JUMP_DURATION = "SET_SEEK_JUMP_DURATION",
  SET_VOLUME_HOTKEY_STEP = "SET_VOLUME_HOTKEY_STEP",
  SET_TRACK_RESTART_THRESHOLD = "SET_TRACK_RESTART_THRESHOLD",
  SET_HOTKEY_BINDINGS = "SET_HOTKEY_BINDINGS",
  SET_FEATURE_FLAGS = "SET_FEATURE_FLAGS",

  SET_TRACK_BPM_LOADING = "SET_TRACK_BPM_LOADING",
  SET_TRACK_BPM_SUCCESS = "SET_TRACK_BPM_SUCCESS",
  SET_TRACK_BPM_ERROR = "SET_TRACK_BPM_ERROR",
  CLEAR_TRACK_BPMS = "CLEAR_TRACK_BPMS",
}

export type CoreAction =
  | IAction<CORE_ACTIONS.SET_PAGE_TYPE, BcPageType | null>
  | IAction<CORE_ACTIONS.SET_TRACK_TITLE, string | null>
  | IAction<CORE_ACTIONS.SET_TRACK_NUMBER, string | null>
  | IAction<CORE_ACTIONS.SET_DURATION, number>
  | IAction<CORE_ACTIONS.SET_CURRENT_TIME, number>
  | IAction<CORE_ACTIONS.SET_IS_PLAYING, boolean>
  | IAction<CORE_ACTIONS.SET_DURATION_DISPLAY_METHOD, TimeDisplayMethodType>
  | IAction<CORE_ACTIONS.SET_PLAYBACK_SPEED, number>
  | IAction<CORE_ACTIONS.SET_LOOP_MODE, LoopModeType>
  | IAction<CORE_ACTIONS.CYCLE_LOOP_MODE>
  | IAction<CORE_ACTIONS.SET_IS_MUTED, boolean>
  | IAction<CORE_ACTIONS.TOGGLE_MUTE>
  | IAction<CORE_ACTIONS.SET_VOLUME, number>
  | IAction<CORE_ACTIONS.SET_IS_FULLSCREEN, boolean>
  | IAction<CORE_ACTIONS.SET_SEEK_JUMP_DURATION, number>
  | IAction<CORE_ACTIONS.SET_VOLUME_HOTKEY_STEP, number>
  | IAction<CORE_ACTIONS.SET_TRACK_RESTART_THRESHOLD, number>
  | IAction<CORE_ACTIONS.SET_HOTKEY_BINDINGS, Record<HotkeyAction, KeyBinding>>
  | IAction<CORE_ACTIONS.SET_FEATURE_FLAGS, FeatureFlags>
  | IAction<CORE_ACTIONS.SET_TRACK_BPM_LOADING, string>
  | IAction<CORE_ACTIONS.SET_TRACK_BPM_SUCCESS, { trackUrl: string; bpm: number }>
  | IAction<CORE_ACTIONS.SET_TRACK_BPM_ERROR, string>
  | IAction<CORE_ACTIONS.CLEAR_TRACK_BPMS>;

interface ICoreActions {
  // State
  setPageType: (pageType: BcPageType | null) => CoreAction;
  setTrackTitle: (title: string | null) => CoreAction;
  setTrackNumber: (number: string | null) => CoreAction;
  setDuration: (duration: number) => CoreAction;
  setCurrentTime: (time: number) => CoreAction;
  setIsPlaying: (isPlaying: boolean) => CoreAction;
  setDurationDisplayMethod: (method: TimeDisplayMethodType) => CoreAction;
  setPlaybackSpeed: (speed: number) => CoreAction;
  setLoopMode: (mode: LoopModeType) => CoreAction;
  cycleLoopMode: () => CoreAction;
  setIsMuted: (isMuted: boolean) => CoreAction;
  toggleMute: () => CoreAction;
  setVolume: (volume: number) => CoreAction;
  setIsFullscreen: (isFullscreen: boolean) => CoreAction;

  // Settings
  setSeekJumpDuration: (duration: number) => CoreAction;
  setVolumeHotkeyStep: (step: number) => CoreAction;
  setTrackRestartThreshold: (threshold: number) => CoreAction;
  setHotkeyBindings: (bindings: Record<HotkeyAction, KeyBinding>) => CoreAction;
  setFeatureFlags: (flags: FeatureFlags) => CoreAction;

  // BPM
  setTrackBpmLoading: (trackUrl: string) => CoreAction;
  setTrackBpmSuccess: (trackUrl: string, bpm: number) => CoreAction;
  setTrackBpmError: (trackUrl: string) => CoreAction;
  clearTrackBpms: () => CoreAction;
}

export const coreActions: ICoreActions = {
  setPageType: (pageType: BcPageType | null): CoreAction => ({ type: CORE_ACTIONS.SET_PAGE_TYPE, payload: pageType }),
  setTrackTitle: (title: string | null): CoreAction => ({ type: CORE_ACTIONS.SET_TRACK_TITLE, payload: title }),
  setTrackNumber: (number: string | null): CoreAction => ({ type: CORE_ACTIONS.SET_TRACK_NUMBER, payload: number }),
  setDuration: (duration: number): CoreAction => ({ type: CORE_ACTIONS.SET_DURATION, payload: duration }),
  setCurrentTime: (time: number): CoreAction => ({ type: CORE_ACTIONS.SET_CURRENT_TIME, payload: time }),
  setIsPlaying: (isPlaying: boolean): CoreAction => ({ type: CORE_ACTIONS.SET_IS_PLAYING, payload: isPlaying }),
  setDurationDisplayMethod: (method: TimeDisplayMethodType): CoreAction => ({
    type: CORE_ACTIONS.SET_DURATION_DISPLAY_METHOD,
    payload: method,
  }),
  setPlaybackSpeed: (speed: number): CoreAction => ({
    type: CORE_ACTIONS.SET_PLAYBACK_SPEED,
    payload: speed,
  }),
  setLoopMode: (mode: LoopModeType): CoreAction => ({
    type: CORE_ACTIONS.SET_LOOP_MODE,
    payload: mode,
  }),
  cycleLoopMode: (): CoreAction => ({ type: CORE_ACTIONS.CYCLE_LOOP_MODE }),
  setIsMuted: (isMuted: boolean): CoreAction => ({ type: CORE_ACTIONS.SET_IS_MUTED, payload: isMuted }),
  toggleMute: (): CoreAction => ({ type: CORE_ACTIONS.TOGGLE_MUTE }),
  setVolume: (volume: number): CoreAction => ({ type: CORE_ACTIONS.SET_VOLUME, payload: volume }),
  setIsFullscreen: (isFullscreen: boolean): CoreAction => ({
    type: CORE_ACTIONS.SET_IS_FULLSCREEN,
    payload: isFullscreen,
  }),

  setHotkeyBindings: (bindings: Record<HotkeyAction, KeyBinding>): CoreAction => ({
    type: CORE_ACTIONS.SET_HOTKEY_BINDINGS,
    payload: bindings,
  }),
  setSeekJumpDuration: (duration: number): CoreAction => ({
    type: CORE_ACTIONS.SET_SEEK_JUMP_DURATION,
    payload: duration,
  }),
  setVolumeHotkeyStep: (step: number): CoreAction => ({
    type: CORE_ACTIONS.SET_VOLUME_HOTKEY_STEP,
    payload: step,
  }),
  setTrackRestartThreshold: (threshold: number): CoreAction => ({
    type: CORE_ACTIONS.SET_TRACK_RESTART_THRESHOLD,
    payload: threshold,
  }),
  setFeatureFlags: (flags: FeatureFlags): CoreAction => ({
    type: CORE_ACTIONS.SET_FEATURE_FLAGS,
    payload: flags,
  }),

  setTrackBpmLoading: (trackUrl: string): CoreAction => ({
    type: CORE_ACTIONS.SET_TRACK_BPM_LOADING,
    payload: trackUrl,
  }),
  setTrackBpmSuccess: (trackUrl: string, bpm: number): CoreAction => ({
    type: CORE_ACTIONS.SET_TRACK_BPM_SUCCESS,
    payload: { trackUrl, bpm },
  }),
  setTrackBpmError: (trackUrl: string): CoreAction => ({
    type: CORE_ACTIONS.SET_TRACK_BPM_ERROR,
    payload: trackUrl,
  }),
  clearTrackBpms: (): CoreAction => ({ type: CORE_ACTIONS.CLEAR_TRACK_BPMS }),
} as const;

export type AppCoreListener<AppCoreProp extends keyof AppCore = keyof AppCore> = (
  value: AppCore[AppCoreProp],
  prevValue: AppCore[AppCoreProp]
) => void;

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
