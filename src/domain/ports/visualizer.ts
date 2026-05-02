export interface AudioVisualizerPort {
  start(audioEl: HTMLAudioElement, canvas: HTMLCanvasElement): void;
  stop(): void;
  isRunning(): boolean;
}
