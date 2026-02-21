import { BcPageType, TimeDisplayMethodType } from "./bandcamp";

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
