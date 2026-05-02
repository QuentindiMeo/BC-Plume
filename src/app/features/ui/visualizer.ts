import { runVisualizer, stopVisualizer } from "@/app/use-cases/run-visualizer";
import { PLUME_ELEM_SELECTORS } from "@/infra/elements/plume";

export const createVisualizerCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.id = PLUME_ELEM_SELECTORS.visualizerCanvas.split("#")[1];
  canvas.ariaHidden = "true";
  runVisualizer(canvas);
  return canvas;
};

export const cleanupVisualizerCanvas = (): void => {
  stopVisualizer();
};
