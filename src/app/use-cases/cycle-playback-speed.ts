import { PLAYBACK_SPEED_STEPS } from "@/domain/plume";
import { coreActions } from "@/domain/ports/app-core";
import type { IAppCore } from "@/domain/ports/app-core";

export const cyclePlaybackSpeed = (appCore: IAppCore): void => {
  const current = appCore.getState().playbackSpeed;
  const currentIndex = PLAYBACK_SPEED_STEPS.indexOf(current);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % PLAYBACK_SPEED_STEPS.length;
  appCore.dispatch(coreActions.setPlaybackSpeed(PLAYBACK_SPEED_STEPS[nextIndex]));
};
