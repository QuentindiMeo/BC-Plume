import { getTrackAudioInstance, getVisualizerInstance } from "@/app/stores/adapters";
import { getAppCoreInstance } from "@/app/stores/AppCoreImpl";
import type { AppCore } from "@/domain/ports/app-core";

const DEFAULT_BPM = 120;

const resolveCurrentBpm = (state: AppCore): number => {
  const match = state.trackNumber?.match(/(\d+)/);
  if (match) {
    const currentNum = Number(match[1]);
    const infos = getTrackAudioInstance().getTrackAudioInfos();
    const info = infos.find((i) => i.trackNumber === currentNum);
    const bpm = info?.trackUrl ? state.trackBpms[info.trackUrl]?.bpm : null;
    if (bpm) return bpm;
  }
  return DEFAULT_BPM;
};

export const runVisualizer = (canvas: HTMLCanvasElement): void => {
  const state = getAppCoreInstance().getState();
  if (!state.featureFlags.visualizer) return;
  getVisualizerInstance().start(canvas, resolveCurrentBpm(state));
};

export const stopVisualizer = (): void => {
  getVisualizerInstance().stop();
};

export const syncVisualizerWithPlayback = (isPlaying: boolean, canvas: HTMLCanvasElement): void => {
  if (isPlaying) runVisualizer(canvas);
  else stopVisualizer();
};
