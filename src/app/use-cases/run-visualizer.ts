import { getVisualizerInstance } from "@/app/stores/adapters";
import { getAppCoreInstance } from "@/app/stores/AppCoreImpl";
import { getGuiInstance } from "@/app/stores/GuiImpl";

export const runVisualizer = (canvas: HTMLCanvasElement): void => {
  const appState = getAppCoreInstance().getState();
  if (!appState.featureFlags.visualizer) return;

  const plume = getGuiInstance().getState();
  if (!plume.audioElement) return;

  const visualizer = getVisualizerInstance();
  visualizer.start(plume.audioElement, canvas);
};

export const stopVisualizer = (): void => {
  const visualizer = getVisualizerInstance();
  visualizer.stop();
};
