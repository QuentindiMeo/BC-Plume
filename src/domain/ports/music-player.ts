export interface MusicPlayerPort {
  // State
  getDuration(): number;
  getCurrentTime(): number;
  getPlaybackRate(): number;
  getVolume(): number;
  isPaused(): boolean;

  // Commands
  seekTo(time: number): void;
  seekAndPreservePause(time: number): void; // Seek while preserving pause state (see adapter for policy details)
  setPlaybackRate(rate: number): void;
  play(): void;
  pause(): void;
  setLoop(loop: boolean): void;
  setVolume(volume: number): void;

  // Event wiring
  on(event: string, handler: EventListener): void;
  off(event: string, handler: EventListener): void;
}
