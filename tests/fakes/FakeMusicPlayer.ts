import type { MusicPlayerPort } from "@/domain/ports/music-player";

/**
 * In-memory MusicPlayerPort for tests. Exposes currentTime and loop as
 * readable fields so tests can assert on observable player state directly.
 */
export class FakeMusicPlayer implements MusicPlayerPort {
  currentTime: number;
  duration: number;
  loop: boolean = false;

  constructor({ currentTime = 0, duration = 0 }: { currentTime?: number; duration?: number } = {}) {
    this.currentTime = currentTime;
    this.duration = duration;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getDuration(): number {
    return this.duration;
  }

  seekAndPreservePause(time: number): void {
    this.currentTime = time;
  }

  seekTo(time: number): void {
    this.currentTime = time;
  }

  setLoop(loop: boolean): void {
    this.loop = loop;
  }

  isPaused(): boolean {
    return false;
  }

  getVolume(): number {
    return 1;
  }

  play(): void {}
  pause(): void {}
  setVolume(_volume: number): void {}
  on(_event: string, _handler: EventListener): void {}
  off(_event: string, _handler: EventListener): void {}
}
