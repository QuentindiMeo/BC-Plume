export interface AudioVisualizerPort {
  start(canvas: HTMLCanvasElement, bpm: number, audioTime: number): void;
  stop(): void;
  isRunning(): boolean;
}
