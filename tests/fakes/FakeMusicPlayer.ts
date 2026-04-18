import type { MusicPlayerPort } from "@/domain/ports/music-player";

type InMemoryMusicPlayerInitialState = {
  currentTime?: number;
  duration?: number;
};

/**
 * In-memory MusicPlayerPort for tests. Exposes currentTime and loop as
 * readable fields so tests can assert on observable player state directly.
 */
export class FakeMusicPlayer implements MusicPlayerPort {
  currentTime: number;
  duration: number;
  playbackRate: number = 1;
  loop: boolean = false;

  constructor({ currentTime = 0, duration = 0 }: InMemoryMusicPlayerInitialState = {}) {
    this.currentTime = currentTime;
    this.duration = duration;
  }

  getDuration(): number {
    return this.duration;
  }
  getCurrentTime(): number {
    return this.currentTime;
  }

  getPlaybackRate(): number {
    return this.playbackRate;
  }

  getVolume(): number {
    return 1;
  }

  isPaused(): boolean {
    return false;
  }

  seekTo(time: number): void {
    this.currentTime = time;
  }
  seekAndPreservePause(time: number): void {
    this.currentTime = time;
  }

  setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
  }

  play(): void {}
  pause(): void {}

  setLoop(loop: boolean): void {
    this.loop = loop;
  }
  setVolume(_volume: number): void {}

  on(_event: string, _handler: EventListener): void {}
  off(_event: string, _handler: EventListener): void {}
}
