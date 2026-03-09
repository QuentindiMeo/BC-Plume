import { PLUME_CONSTANTS } from "../../../domain/plume";
import { coreActions } from "../../../domain/ports/app-core";
import { guiActions } from "../../../domain/ports/plume-ui";
import { PLUME_ELEM_SELECTORS } from "../../../infra/elements/plume";
import { getString } from "../../../shared/i18n";
import { CPL, logger } from "../../../shared/logger";
import { getMusicPlayerInstance } from "../../stores/adapters";
import { getAppCoreInstance } from "../../stores/AppCoreImpl";
import { getGuiInstance } from "../../stores/GuiImpl";
import { seekToProgress, toggleDurationDisplay } from "../../use-cases";

const { PROGRESS_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

const handleDurationClick = (): void => {
  const appCore = getAppCoreInstance();
  toggleDurationDisplay(appCore);
};

export const dispatchAudioProgressToStore = (): void => {
  const appCore = getAppCoreInstance();
  const musicPlayer = getMusicPlayerInstance();

  appCore.dispatch(coreActions.setCurrentTime(musicPlayer.getCurrentTime()));
  appCore.dispatch(coreActions.setDuration(musicPlayer.getDuration()));
};

export const createProgressBar = (): HTMLDivElement => {
  const plumeUi = getGuiInstance();

  const container = document.createElement("div");
  container.id = PLUME_ELEM_SELECTORS.progressContainer.split("#")[1];

  const progressSlider = document.createElement("input");
  progressSlider.id = PLUME_ELEM_SELECTORS.progressSlider.split("#")[1];
  progressSlider.type = "range";
  progressSlider.min = "0";
  progressSlider.max = PROGRESS_SLIDER_GRANULARITY.toString();
  progressSlider.value = "0";
  progressSlider.ariaLabel = getString("ARIA__PROGRESS_SLIDER");

  const timeDisplay = document.createElement("div");
  timeDisplay.id = PLUME_ELEM_SELECTORS.timeDisplay.split("#")[1];

  const elapsed = document.createElement("span");
  elapsed.id = PLUME_ELEM_SELECTORS.elapsedDisplay.split("#")[1];
  elapsed.textContent = "0:00";

  const duration = document.createElement("span");
  duration.id = PLUME_ELEM_SELECTORS.durationDisplay.split("#")[1];
  duration.textContent = "0:00";
  duration.title = getString("LABEL__TIME_DISPLAY__INVERT");

  progressSlider.addEventListener("input", function (this: HTMLInputElement) {
    const musicPlayer = getMusicPlayerInstance();
    const targetValue = Number.parseFloat(this.value);
    const readableValue = ((targetValue / PROGRESS_SLIDER_GRANULARITY) * (musicPlayer.getDuration() || 0)).toFixed(2);

    logger(CPL.DEBUG, getString("DEBUG__PROGRESS_SLIDER__INPUT", [readableValue]));
    seekToProgress(targetValue, getAppCoreInstance(), musicPlayer);
  });

  duration.addEventListener("click", handleDurationClick);

  plumeUi.dispatch(guiActions.setProgressSlider(progressSlider));
  plumeUi.dispatch(guiActions.setElapsedDisplay(elapsed));
  plumeUi.dispatch(guiActions.setDurationDisplay(duration));

  timeDisplay.appendChild(elapsed);
  timeDisplay.appendChild(duration);
  container.appendChild(progressSlider);
  container.appendChild(timeDisplay);

  return container;
};
