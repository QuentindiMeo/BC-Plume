import { getTrackAudioInstance, getVisualizerInstance } from "@/app/stores/adapters";
import { getAppCoreInstance } from "@/app/stores/AppCoreImpl";
import type { AppCore } from "@/domain/ports/app-core";

const resolveCurrentBpm = (appState: AppCore): number | null => {
  const match = appState.trackNumber?.match(/(\d+)/);
  if (match) {
    const currentNum = Number(match[1]);
    const infos = getTrackAudioInstance().getTrackAudioInfos();
    const info = infos.find((i) => i.trackNumber === currentNum);
    const bpm = info?.trackUrl ? appState.trackBpms[info.trackUrl]?.bpm : null;
    if (!!bpm && Number.isFinite(bpm)) return bpm;
  }
  return null;
};

export const runVisualizer = (canvas: HTMLCanvasElement): void => {
  const appState = getAppCoreInstance().getState();
  if (!appState.featureFlags.visualizer) return;

  const bpm = resolveCurrentBpm(appState);
  if (!bpm) return;

  const visualizer = getVisualizerInstance();
  visualizer.start(canvas, bpm, appState.currentTime ?? 0);
};

export const stopVisualizer = (): void => {
  const visualizer = getVisualizerInstance();
  visualizer.stop();
};

export const syncVisualizerWithPlayback = (isPlaying: boolean, canvas: HTMLCanvasElement): void => {
  if (isPlaying) runVisualizer(canvas);
  else stopVisualizer();
};
