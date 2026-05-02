export interface AudioVisualizerPort {
  start(canvas: HTMLCanvasElement, bpm: number): void;
  stop(): void;
  isRunning(): boolean;
}
