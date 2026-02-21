const pendingSeekPause = new WeakMap<HTMLAudioElement, AbortController>();

export const seekAndPreservePause = (audioElement: HTMLAudioElement, targetTime: number): void => {
  const wasPaused = audioElement.paused;

  pendingSeekPause.get(audioElement)?.abort();
  audioElement.currentTime = targetTime;

  if (wasPaused) {
    const controller = new AbortController();
    pendingSeekPause.set(audioElement, controller);

    const cleanup = () => {
      controller.abort();
      pendingSeekPause.delete(audioElement);
    };

    // Intercept spurious play() when seeking and cancel it.
    audioElement.addEventListener("play", () => audioElement.pause(), { signal: controller.signal });

    // Keep the play-interceptor alive for 100 ms after seeking completes to catch repeated seeks when dragging the progress slider.
    audioElement.addEventListener("seeked", () => setTimeout(cleanup, 100), { once: true, signal: controller.signal });
  }
};
