import { getTrackAudioInstance, getVisualizerInstance } from "@/app/stores/adapters";
import { getAppCoreInstance } from "@/app/stores/AppCoreImpl";
import type { AppCore } from "@/domain/ports/app-core";

const resolveCurrentBpm = (state: AppCore): number | null => {
  const match = state.trackNumber?.match(/(\d+)/);
  if (match) {
    const currentNum = Number(match[1]);
    const infos = getTrackAudioInstance().getTrackAudioInfos();
    const info = infos.find((i) => i.trackNumber === currentNum);
    const bpm = info?.trackUrl ? state.trackBpms[info.trackUrl]?.bpm : null;
    if (bpm) return bpm;
  }
  return null;
};

export const runVisualizer = (canvas: HTMLCanvasElement): void => {
  const state = getAppCoreInstance().getState();
  if (!state.featureFlags.visualizer) return;

  const bpm = resolveCurrentBpm(state);
  if (!bpm) return;

  const visualizer = getVisualizerInstance();
  visualizer.start(canvas, bpm);
};

export const stopVisualizer = (): void => {
  const visualizer = getVisualizerInstance();
  visualizer.stop();
};

export const syncVisualizerWithPlayback = (isPlaying: boolean, canvas: HTMLCanvasElement): void => {
  if (isPlaying) runVisualizer(canvas);
  else stopVisualizer();
};
