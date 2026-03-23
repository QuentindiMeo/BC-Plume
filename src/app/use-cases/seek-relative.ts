import { PLUME_CONSTANTS } from "../../domain/plume";
import { coreActions, IAppCore } from "../../domain/ports/app-core";
import type { MusicPlayerPort } from "../../domain/ports/music-player";

const { PLAYBACK_STEP_DURATION_SECONDS: TIME_STEP_DURATION } = PLUME_CONSTANTS;

// Seeks backward by TIME_STEP_DURATION seconds, clamped to 0
export const seekBackward = (appCore: IAppCore, player: MusicPlayerPort): void => {
  const newTime = Math.max(0, player.getCurrentTime() - TIME_STEP_DURATION);
  player.seekAndPreservePause(newTime);
  // Eagerly sync the store; audio-events.ts also dispatches setCurrentTime on
  // timeupdate but that fires asynchronously — this prevents a stale-UI frame.
  appCore.dispatch(coreActions.setCurrentTime(newTime));
};

// Seeks forward by TIME_STEP_DURATION seconds, clamped to track duration
export const seekForward = (appCore: IAppCore, player: MusicPlayerPort): void => {
  const newTime = Math.min(player.getDuration() || 0, player.getCurrentTime() + TIME_STEP_DURATION);
  player.seekAndPreservePause(newTime);
  // Same rationale as seekBackward above.
  appCore.dispatch(coreActions.setCurrentTime(newTime));
};
