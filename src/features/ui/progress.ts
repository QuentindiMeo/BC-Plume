import { TIME_DISPLAY_METHOD } from "../../domain/bandcamp";
import { PLUME_CONSTANTS, PLUME_ELEM_IDENTIFIERS } from "../../domain/plume";
import { getPlumeUiInstance, PLUME_ACTION_TYPES } from "../../infra/AppInstanceImpl";
import { getStoreInstance, STORE_ACTION_TYPES } from "../../infra/AppStoreImpl";
import { getFormattedDuration, getFormattedElapsed, getProgressPercentage } from "../formatting";
import { getString } from "../i18n";

const { PROGRESS_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

const handleDurationClick = (): void => {
  const store = getStoreInstance();
  const currentMethod = store.getState().durationDisplayMethod;
  const newMethod =
    currentMethod === TIME_DISPLAY_METHOD.DURATION ? TIME_DISPLAY_METHOD.REMAINING : TIME_DISPLAY_METHOD.DURATION;

  store.dispatch({
    type: STORE_ACTION_TYPES.SET_DURATION_DISPLAY_METHOD,
    payload: newMethod,
  });

  const plumeUi = getPlumeUiInstance();
  const plume = plumeUi.getState();

  store.dispatch({ type: STORE_ACTION_TYPES.SET_DURATION, payload: plume.audioElement.duration });

  const state = store.getState();
  plume.durationDisplay.textContent = getFormattedDuration(state);
  plumeUi.dispatch({ type: PLUME_ACTION_TYPES.SET_DURATION_DISPLAY, payload: plume.durationDisplay });
};

export const updateProgressBar = (): void => {
  const store = getStoreInstance();
  const plumeUi = getPlumeUiInstance();
  const plume = plumeUi.getState();

  store.dispatch({ type: STORE_ACTION_TYPES.SET_CURRENT_TIME, payload: plume.audioElement.currentTime });
  store.dispatch({ type: STORE_ACTION_TYPES.SET_DURATION, payload: plume.audioElement.duration });

  const elapsed = plume.audioElement.currentTime;
  const duration = plume.audioElement.duration;

  if (Number.isNaN(elapsed) || Number.isNaN(duration)) return;

  const state = store.getState();
  const percent = getProgressPercentage(state);
  const bgPercent = percent < 50 ? percent + 1 : percent - 1;
  const bgImg = `linear-gradient(90deg, var(--progbar-fill-bg-left) ${bgPercent.toFixed(1)}%, var(--progbar-bg) 0%)`;

  plume.progressSlider.value = `${percent * (PROGRESS_SLIDER_GRANULARITY / 100)}`;
  plume.progressSlider.style.backgroundImage = bgImg;
  plume.elapsedDisplay.textContent = getFormattedElapsed(state);
  plume.durationDisplay.textContent = getFormattedDuration(state);

  plumeUi.dispatch({ type: PLUME_ACTION_TYPES.SET_PROGRESS_SLIDER, payload: plume.progressSlider });
  plumeUi.dispatch({ type: PLUME_ACTION_TYPES.SET_ELAPSED_DISPLAY, payload: plume.elapsedDisplay });
  plumeUi.dispatch({ type: PLUME_ACTION_TYPES.SET_DURATION_DISPLAY, payload: plume.durationDisplay });
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
    if (plume.audioElement.paused) {
      setTimeout(() => {
        plume.audioElement.pause();
      }, 10);
    }
    plumeUi.dispatch({ type: PLUME_ACTION_TYPES.SET_AUDIO_ELEMENT, payload: plume.audioElement });
  });

  duration.addEventListener("click", handleDurationClick);

  plumeUi.dispatch({ type: PLUME_ACTION_TYPES.SET_PROGRESS_SLIDER, payload: progressSlider });
  plumeUi.dispatch({ type: PLUME_ACTION_TYPES.SET_ELAPSED_DISPLAY, payload: elapsed });
  plumeUi.dispatch({ type: PLUME_ACTION_TYPES.SET_DURATION_DISPLAY, payload: duration });

  timeDisplay.appendChild(elapsed);
  timeDisplay.appendChild(duration);
  container.appendChild(progressSlider);
  container.appendChild(timeDisplay);

  return container;
};
