export interface MusicPlayerPort {
  // State
  isPaused(): boolean;
  getVolume(): number;
  getCurrentTime(): number;
  getDuration(): number;

  // Commands
  seekTo(time: number): void;
  seekAndPreservePause(time: number): void; // Seek while preserving pause state (see adapter for policy details)
  play(): void;
  pause(): void;
  setLoop(loop: boolean): void;
  setVolume(volume: number): void;

  // Event wiring
  on(event: string, handler: EventListener): void;
  off(event: string, handler: EventListener): void;
}
