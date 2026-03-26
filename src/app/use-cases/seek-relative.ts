import { coreActions, IAppCore } from "../../domain/ports/app-core";
import type { MusicPlayerPort } from "../../domain/ports/music-player";

// Seeks backward by seekJumpDuration seconds, clamped to 0
export const seekBackward = (appCore: IAppCore, player: MusicPlayerPort): void => {
  const step = appCore.getState().seekJumpDuration;
  const newTime = Math.max(0, player.getCurrentTime() - step);
  player.seekAndPreservePause(newTime);
  // Eagerly sync the store; audio-events.ts also dispatches setCurrentTime on
  // timeupdate but that fires asynchronously — this prevents a stale-UI frame.
  appCore.dispatch(coreActions.setCurrentTime(newTime));
};

// Seeks forward by seekJumpDuration seconds, clamped to track duration
export const seekForward = (appCore: IAppCore, player: MusicPlayerPort): void => {
  const step = appCore.getState().seekJumpDuration;
  const newTime = Math.min(player.getDuration() || 0, player.getCurrentTime() + step);
  player.seekAndPreservePause(newTime);
  // Same rationale as seekBackward above.
  appCore.dispatch(coreActions.setCurrentTime(newTime));
};
