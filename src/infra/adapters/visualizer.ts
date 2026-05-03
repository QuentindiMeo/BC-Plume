import type { AudioVisualizerPort } from "@/domain/ports/visualizer";

const MILLISECONDS_PER_MINUTE = 60000;
const BAR_COUNT = 64;
const BAR_GAP = 1;
const BAR_MAX_HEIGHT = 0.25; // Max bar height as a fraction of canvas height

// Quick attack, exponential decay — simulates a kick/hit envelope on each beat
const beatEnvelope = (phase: number): number => {
  if (phase < 0.05) return phase / 0.05; // linear rise 0 → 1 over first 5% of beat
  return Math.exp(-4 * (phase - 0.05)); // exponential decay toward next beat
};

// Spectral weight: peaks around bar 10 (bass) and bar 26 (low-mid), rolls off high
const spectralShape = (i: number): number => {
  const x = i / BAR_COUNT;
  return Math.exp(-10 * (x - 0.15) ** 2) * 0.7 + Math.exp(-3 * (x - 0.4) ** 2) * 0.3;
};

// Deterministic per-bar per-beat noise for organic variation (range 0.6 – 1.0)
const barNoise = (i: number, beat: number): number => {
  const h = ((i * 1619 + beat * 31337) ^ (i * 2053)) & 0xffff;
  return 0.6 + 0.4 * (h / 0xffff);
};

export class AudioVisualizerAdapter implements AudioVisualizerPort {
  private rafHandle: number | null = null;

  start(canvas: HTMLCanvasElement, bpm: number, audioTime: number): void {
    if (this.isRunning()) this.stop();

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const beatInterval = MILLISECONDS_PER_MINUTE / bpm;
    // Lazy reference timestamp: set on first frame so that audioMs starts exactly at audioTime.
    // refTimestamp = firstTimestamp - audioTime * 1000  →  audioMs = timestamp - refTimestamp = audioTime * 1000 + elapsed
    let refTimestamp: number | null = null;

    const draw = (timestamp: number): void => {
      if (refTimestamp === null) refTimestamp = timestamp - audioTime * 1000;
      const audioMs = timestamp - refTimestamp;
      const phase = (audioMs % beatInterval) / beatInterval;
      const beat = Math.floor(audioMs / beatInterval);
      const energy = beatEnvelope(phase);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / BAR_COUNT - BAR_GAP;
      for (let i = 0; i < BAR_COUNT; i++) {
        const amplitude = energy * spectralShape(i) * barNoise(i, beat);
        const barHeight = amplitude * height * BAR_MAX_HEIGHT;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(amplitude, 1).toFixed(2)})`;
        ctx.fillRect(i * (barWidth + BAR_GAP), height - barHeight, barWidth, barHeight);
      }

      this.rafHandle = requestAnimationFrame(draw);
    };

    this.rafHandle = requestAnimationFrame(draw);
  }

  stop(): void {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  isRunning(): boolean {
    return this.rafHandle !== null;
  }
}
