import type { AudioProviderPort } from "../../domain/ports/audio-provider";
import type { MusicPlayerPort } from "../../domain/ports/music-player";

// WeakMap key is the underlying HTMLAudioElement so entries are GC'd when the element is replaced.
const pendingSeekPause = new WeakMap<HTMLAudioElement, AbortController>();

export class MusicPlayerAdapter implements MusicPlayerPort {
  constructor(private readonly audioProvider: AudioProviderPort) {}

  private get audio(): HTMLAudioElement {
    return this.audioProvider.getAudioElement();
  }

  isPaused(): boolean {
    return this.audio.paused;
  }

  getVolume(): number {
    return this.audio.volume;
  }

  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  getDuration(): number {
    return this.audio.duration;
  }

  play(): void {
    void this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  setVolume(volume: number): void {
    this.audio.volume = volume;
  }

  seekTo(time: number): void {
    this.audio.currentTime = time;
  }

  /**
   * When the audio is paused, Bandcamp fires a spurious play() on seek.
   * This method intercepts that event and cancels it, keeping the player paused.
   */
  seekAndPreservePause(time: number): void {
    const audio = this.audio;
    const wasPaused = audio.paused;

    pendingSeekPause.get(audio)?.abort();
    audio.currentTime = time;

    if (wasPaused) {
      const controller = new AbortController();
      pendingSeekPause.set(audio, controller);

      const cleanup = () => {
        controller.abort();
        pendingSeekPause.delete(audio);
      };

      audio.addEventListener("play", () => audio.pause(), { signal: controller.signal });
      // Prevent playing for 100ms while seeking (especially useful when drag-seeking)
      audio.addEventListener("seeked", () => setTimeout(cleanup, 100), { once: true, signal: controller.signal });
    }
  }

  on(event: string, handler: EventListener): void {
    this.audio.addEventListener(event, handler);
  }

  off(event: string, handler: EventListener): void {
    this.audio.removeEventListener(event, handler);
  }
}
