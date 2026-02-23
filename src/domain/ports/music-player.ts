export interface MusicPlayerPort {
  // State
  isPaused(): boolean;
  getVolume(): number;
  getCurrentTime(): number;
  getDuration(): number;

  // Commands
  play(): void;
  pause(): void;
  setVolume(volume: number): void;
  seekTo(time: number): void;

  // Seek while preserving pause state (see adapter for policy details)
  seekAndPreservePause(time: number): void;

  // Event wiring
  on(event: string, handler: EventListener): void;
  off(event: string, handler: EventListener): void;
}
