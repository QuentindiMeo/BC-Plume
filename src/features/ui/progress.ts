import { TIME_DISPLAY_METHOD } from "../../domain/bandcamp";
import { PLUME_CONSTANTS, PLUME_ELEM_IDENTIFIERS } from "../../domain/plume";
import { getPlumeUiInstance, plumeActions } from "../../infra/AppInstanceImpl";
import { getStoreInstance, storeActions } from "../../infra/AppStoreImpl";
import { getString } from "../i18n";

const { PROGRESS_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

const handleDurationClick = (): void => {
  const store = getStoreInstance();
  const currentMethod = store.getState().durationDisplayMethod;
  const newMethod =
    currentMethod === TIME_DISPLAY_METHOD.DURATION ? TIME_DISPLAY_METHOD.REMAINING : TIME_DISPLAY_METHOD.DURATION;

  store.dispatch(storeActions.setDurationDisplayMethod(newMethod));
};

export const dispatchAudioProgressToStore = (): void => {
  const store = getStoreInstance();
  const plumeUi = getPlumeUiInstance();
  const plume = plumeUi.getState();

  store.dispatch(storeActions.setCurrentTime(plume.audioElement.currentTime));
  store.dispatch(storeActions.setDuration(plume.audioElement.duration));
};

export const createProgressBar = (): HTMLDivElement => {
  const plumeUi = getPlumeUiInstance();
  const plume = plumeUi.getState();

  const container = document.createElement("div");
  container.id = PLUME_ELEM_IDENTIFIERS.progressContainer.split("#")[1];

  const progressSlider = document.createElement("input");
  progressSlider.id = PLUME_ELEM_IDENTIFIERS.progressSlider.split("#")[1];
  progressSlider.type = "range";
  progressSlider.min = "0";
  progressSlider.max = PROGRESS_SLIDER_GRANULARITY.toString();
  progressSlider.value = "0";
  progressSlider.ariaLabel = getString("ARIA__PROGRESS_SLIDER");

  const timeDisplay = document.createElement("div");
  timeDisplay.id = PLUME_ELEM_IDENTIFIERS.timeDisplay.split("#")[1];

  const elapsed = document.createElement("span");
  elapsed.id = PLUME_ELEM_IDENTIFIERS.elapsedDisplay.split("#")[1];
  elapsed.textContent = "0:00";

  const duration = document.createElement("span");
  duration.id = PLUME_ELEM_IDENTIFIERS.durationDisplay.split("#")[1];
  duration.textContent = "0:00";
  duration.title = getString("LABEL__TIME_DISPLAY__INVERT");

  progressSlider.addEventListener("input", function (this: HTMLInputElement) {
    const progress = Number.parseFloat(this.value) / PROGRESS_SLIDER_GRANULARITY;
    plume.audioElement.currentTime = progress * (plume.audioElement.duration || 0);

    // Preserve paused state after seeking
    const wasPaused = plume.audioElement.paused;
    if (wasPaused) {
      setTimeout(() => {
        plume.audioElement.pause();
      }, 10);
    }
  });

  duration.addEventListener("click", handleDurationClick);

  plumeUi.dispatch(plumeActions.setProgressSlider(progressSlider));
  plumeUi.dispatch(plumeActions.setElapsedDisplay(elapsed));
  plumeUi.dispatch(plumeActions.setDurationDisplay(duration));

  timeDisplay.appendChild(elapsed);
  timeDisplay.appendChild(duration);
  container.appendChild(progressSlider);
  container.appendChild(timeDisplay);

  return container;
};
