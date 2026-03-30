import { PLUME_CONSTANTS } from "@/domain/plume";
import { coreActions, IAppCore } from "@/domain/ports/app-core";

const { VOLUME_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

// Normalizes a raw slider value to [0..1], auto-unmutes when sliding above zero
export const setVolume = (rawSliderValue: number, appCore: IAppCore): void => {
  const volume = rawSliderValue / VOLUME_SLIDER_GRANULARITY;

  if (volume > 0 && appCore.getState().isMuted) {
    appCore.dispatch(coreActions.setIsMuted(false));
  }

  appCore.dispatch(coreActions.setVolume(volume));
};
