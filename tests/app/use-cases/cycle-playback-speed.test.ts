import { describe, expect, it, vi } from "vitest";

import { cyclePlaybackSpeed } from "@/app/use-cases/cycle-playback-speed";
import { PLAYBACK_SPEED_DEFAULT, PLAYBACK_SPEED_STEPS, PLUME_DEFAULTS } from "@/domain/plume";
import { CORE_ACTIONS, type AppCore, type IAppCore } from "@/domain/ports/app-core";

const makeAppCore = (playbackSpeed: number): { appCore: IAppCore; dispatch: ReturnType<typeof vi.fn> } => {
  const dispatch = vi.fn();
  return {
    appCore: {
      getState: vi.fn(() => ({ playbackSpeed }) as AppCore),
      dispatch,
    } as unknown as IAppCore,
    dispatch,
  };
};

describe("cyclePlaybackSpeed", () => {
  it("dispatches SET_PLAYBACK_SPEED to the next step from the default", () => {
    const { appCore, dispatch } = makeAppCore(PLAYBACK_SPEED_DEFAULT);

    cyclePlaybackSpeed(appCore);

    expect(dispatch).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledWith({
      type: CORE_ACTIONS.SET_PLAYBACK_SPEED,
      payload: PLAYBACK_SPEED_STEPS[PLAYBACK_SPEED_STEPS.indexOf(PLAYBACK_SPEED_DEFAULT) + 1],
    });
  });

  it("cycles through every step in order", () => {
    for (let i = 0; i < PLAYBACK_SPEED_STEPS.length - 1; i++) {
      const current = PLAYBACK_SPEED_STEPS[i];
      const expected = PLAYBACK_SPEED_STEPS[i + 1];
      const { appCore, dispatch } = makeAppCore(current);

      cyclePlaybackSpeed(appCore);

      expect(dispatch).toHaveBeenCalledWith({ type: CORE_ACTIONS.SET_PLAYBACK_SPEED, payload: expected });
    }
  });

  it("wraps around from the last step back to the first", () => {
    const lastStep = PLAYBACK_SPEED_STEPS[PLAYBACK_SPEED_STEPS.length - 1];
    const { appCore, dispatch } = makeAppCore(lastStep);

    cyclePlaybackSpeed(appCore);

    expect(dispatch).toHaveBeenCalledWith({
      type: CORE_ACTIONS.SET_PLAYBACK_SPEED,
      payload: PLAYBACK_SPEED_STEPS[0],
    });
  });

  it("jumps to the first step when current speed is not in the step list", () => {
    const { appCore, dispatch } = makeAppCore(99);

    cyclePlaybackSpeed(appCore);

    expect(dispatch).toHaveBeenCalledWith({
      type: CORE_ACTIONS.SET_PLAYBACK_SPEED,
      payload: PLAYBACK_SPEED_STEPS[0],
    });
  });

  it("covers all 9 steps before wrapping", () => {
    expect(PLAYBACK_SPEED_STEPS).toHaveLength(9);
    let speed: number = PLUME_DEFAULTS.playbackSpeed;

    const visited = new Set<number>();
    for (let i = 0; i < PLAYBACK_SPEED_STEPS.length; i++) {
      const { appCore, dispatch } = makeAppCore(speed);
      cyclePlaybackSpeed(appCore);
      const next = (dispatch.mock.calls[0][0] as { payload: number }).payload;
      visited.add(next);
      speed = next;
    }

    expect(visited.size).toBe(PLAYBACK_SPEED_STEPS.length);
  });
});
