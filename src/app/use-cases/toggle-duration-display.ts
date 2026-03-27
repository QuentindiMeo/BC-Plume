import { TIME_DISPLAY_METHOD } from "@/domain/plume";
import { coreActions, IAppCore } from "@/domain/ports/app-core";

// Cycles the duration display between DURATION and REMAINING
export const toggleDurationDisplay = (appCore: IAppCore): void => {
  const currentMethod = appCore.getState().durationDisplayMethod;
  const newMethod =
    currentMethod === TIME_DISPLAY_METHOD.DURATION ? TIME_DISPLAY_METHOD.REMAINING : TIME_DISPLAY_METHOD.DURATION;

  appCore.dispatch(coreActions.setDurationDisplayMethod(newMethod));
};
