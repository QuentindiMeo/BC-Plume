import { PLUME_CONSTANTS } from "@/domain/plume";
import { coreActions, IAppCore } from "@/domain/ports/app-core";
import type { MusicPlayerPort } from "@/domain/ports/music-player";

const { PROGRESS_SLIDER_GRANULARITY } = PLUME_CONSTANTS;

// Converts a raw slider value to seconds and seeks the player to that position
export const seekToProgress = (rawSliderValue: number, appCore: IAppCore, player: MusicPlayerPort): void => {
  const progress = rawSliderValue / PROGRESS_SLIDER_GRANULARITY;
  const targetTime = progress * (player.getDuration() || 0);

  player.seekAndPreservePause(targetTime);
  // Dispatch immediately so the store reflects the new position before the next
  // timeupdate event fires. audio-events.ts drives the store via timeupdate, but
  // that event is asynchronous and would leave the UI stale for one tick.
  appCore.dispatch(coreActions.setCurrentTime(targetTime));
};
