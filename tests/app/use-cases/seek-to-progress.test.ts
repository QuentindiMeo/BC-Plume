import { seekToProgress } from "@/src/app/use-cases/seek-to-progress";
import { describe, expect, it } from "vitest";
import { FakeAppCore } from "../../fakes/FakeAppCore";
import { FakeMusicPlayer } from "../../fakes/FakeMusicPlayer";

describe("seekToProgress", () => {
  it("seeks to correct time for a mid-track slider value", () => {
    const appCore = new FakeAppCore();
    const player = new FakeMusicPlayer({ duration: 120 });
    seekToProgress(500, appCore, player);
    expect(player.currentTime).toBe(60);
    expect(appCore.getState().currentTime).toBe(60);
  });

  it("seeks to start when slider is 0", () => {
    const appCore = new FakeAppCore();
    const player = new FakeMusicPlayer({ duration: 120 });
    seekToProgress(0, appCore, player);
    expect(player.currentTime).toBe(0);
    expect(appCore.getState().currentTime).toBe(0);
  });

  it("seeks to end when slider is at full granularity", () => {
    const appCore = new FakeAppCore();
    const player = new FakeMusicPlayer({ duration: 120 });
    seekToProgress(1000, appCore, player);
    expect(player.currentTime).toBe(120);
    expect(appCore.getState().currentTime).toBe(120);
  });

  it("seeks to 0 when duration is 0", () => {
    const appCore = new FakeAppCore();
    const player = new FakeMusicPlayer({ duration: 0 });
    seekToProgress(500, appCore, player);
    expect(player.currentTime).toBe(0);
    expect(appCore.getState().currentTime).toBe(0);
  });

  it("player and store always agree on the resulting position", () => {
    const appCore = new FakeAppCore();
    const player = new FakeMusicPlayer({ duration: 90 });
    seekToProgress(333, appCore, player);
    expect(appCore.getState().currentTime).toBe(player.currentTime);
  });
});
