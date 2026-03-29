import { cycleLoopMode } from "@/app/use-cases/cycle-loop-mode";
import { LOOP_MODE } from "@/domain/plume";
import { CORE_ACTIONS, type AppCore, type IAppCore } from "@/domain/ports/app-core";
import type { MusicPlayerPort } from "@/domain/ports/music-player";
import { describe, expect, it, vi } from "vitest";

const makeAppCore = (loopMode: string): { appCore: IAppCore; dispatch: ReturnType<typeof vi.fn> } => {
  const dispatch = vi.fn();
  return {
    appCore: {
      getState: vi.fn(() => ({ loopMode }) as AppCore),
      dispatch,
    } as unknown as IAppCore,
    dispatch,
  };
};

const makePlayer = (): { player: MusicPlayerPort; setLoop: ReturnType<typeof vi.fn> } => {
  const setLoop = vi.fn();
  return { player: { setLoop } as unknown as MusicPlayerPort, setLoop };
};

describe("cycleLoopMode", () => {
  it("always dispatches the CYCLE_LOOP_MODE action with no payload", () => {
    const { appCore, dispatch } = makeAppCore(LOOP_MODE.NONE);
    const { player } = makePlayer();

    cycleLoopMode(appCore, player);

    expect(dispatch).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledWith({ type: CORE_ACTIONS.CYCLE_LOOP_MODE });
  });

  it("calls setLoop(true) when post-dispatch loopMode is LOOP_MODE.TRACK", () => {
    const { appCore } = makeAppCore(LOOP_MODE.TRACK);
    const { player, setLoop } = makePlayer();

    cycleLoopMode(appCore, player);

    expect(setLoop).toHaveBeenCalledOnce();
    expect(setLoop).toHaveBeenCalledWith(true);
  });

  it("calls setLoop(false) when post-dispatch loopMode is LOOP_MODE.COLLECTION", () => {
    const { appCore } = makeAppCore(LOOP_MODE.COLLECTION);
    const { player, setLoop } = makePlayer();

    cycleLoopMode(appCore, player);

    expect(setLoop).toHaveBeenCalledOnce();
    expect(setLoop).toHaveBeenCalledWith(false);
  });

  it("calls setLoop(false) when post-dispatch loopMode is LOOP_MODE.NONE", () => {
    const { appCore } = makeAppCore(LOOP_MODE.NONE);
    const { player, setLoop } = makePlayer();

    cycleLoopMode(appCore, player);

    expect(setLoop).toHaveBeenCalledOnce();
    expect(setLoop).toHaveBeenCalledWith(false);
  });

  it("calls dispatch before reading state via getState", () => {
    const { appCore, dispatch } = makeAppCore(LOOP_MODE.NONE);
    const { player } = makePlayer();
    const getState = appCore.getState as ReturnType<typeof vi.fn>;

    cycleLoopMode(appCore, player);

    const dispatchOrder = dispatch.mock.invocationCallOrder[0];
    const getStateOrder = getState.mock.invocationCallOrder[0];

    expect(dispatchOrder).toBeLessThan(getStateOrder);
  });
});
