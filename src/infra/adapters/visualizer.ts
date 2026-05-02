import type { AudioVisualizerPort } from "@/domain/ports/visualizer";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

const FFT_SIZE = 256;
const SMOOTHING = 0.8;
const BAR_GAP = 1;

export class AudioVisualizerAdapter implements AudioVisualizerPort {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private rafHandle: number | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;

  start(audioEl: HTMLAudioElement, canvas: HTMLCanvasElement): void {
    if (this.isRunning()) this.stop();

    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audioEl);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = SMOOTHING;
      source.connect(analyser);
      analyser.connect(ctx.destination);

      this.audioContext = ctx;
      this.analyser = analyser;
      this.source = source;
      this.dataArray = new Uint8Array(analyser.frequencyBinCount);
    } catch {
      logger(CPL.WARN, getString("WARN__VISUALIZER__CORS_BLOCKED"));
      return;
    }

    const draw = (): void => {
      this.rafHandle = requestAnimationFrame(draw);

      const analyser = this.analyser;
      const data = this.dataArray;
      if (!analyser || !data) return;

      analyser.getByteFrequencyData(data);

      const canvasCtx = canvas.getContext("2d");
      if (!canvasCtx) return;

      const { width, height } = canvas;
      canvasCtx.clearRect(0, 0, width, height);

      const barWidth = width / data.length - BAR_GAP;
      for (let i = 0; i < data.length; i++) {
        const amplitude = (data[i] ?? 0) / 255;
        const barHeight = amplitude * height;
        canvasCtx.fillStyle = `rgba(255, 255, 255, ${amplitude.toFixed(2)})`;
        canvasCtx.fillRect(i * (barWidth + BAR_GAP), height - barHeight, barWidth, barHeight);
      }
    };

    draw();
  }

  stop(): void {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
    this.source?.disconnect();
    this.analyser?.disconnect();
    void this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.dataArray = null;
  }

  isRunning(): boolean {
    return this.rafHandle !== null;
  }
}
