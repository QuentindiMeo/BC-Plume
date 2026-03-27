import { seekBackward, seekForward } from "@/src/app/use-cases/seek-relative";
import { FakeAppCore } from "@/tests/fakes/FakeAppCore";
import { FakeMusicPlayer } from "@/tests/fakes/FakeMusicPlayer";
import { describe, expect, it } from "vitest";

describe("seekBackward", () => {
  it("seeks backward by seekJumpDuration", () => {
    const appCore = new FakeAppCore({ seekJumpDuration: 10 });
    const player = new FakeMusicPlayer({ currentTime: 30, duration: 120 });
    seekBackward(appCore, player);
    expect(player.currentTime).toBe(20);
    expect(appCore.getState().currentTime).toBe(20);
  });

  it("clamps to 0 when step would go negative", () => {
    const appCore = new FakeAppCore({ seekJumpDuration: 10 });
    const player = new FakeMusicPlayer({ currentTime: 5, duration: 120 });
    seekBackward(appCore, player);
    expect(player.currentTime).toBe(0);
    expect(appCore.getState().currentTime).toBe(0);
  });

  it("clamps to 0 when currentTime is already 0", () => {
    const appCore = new FakeAppCore({ seekJumpDuration: 10 });
    const player = new FakeMusicPlayer({ currentTime: 0, duration: 120 });
    seekBackward(appCore, player);
    expect(player.currentTime).toBe(0);
    expect(appCore.getState().currentTime).toBe(0);
  });

  it("uses seekJumpDuration from store, not a hardcoded value", () => {
    const appCore = new FakeAppCore({ seekJumpDuration: 30 });
    const player = new FakeMusicPlayer({ currentTime: 60, duration: 120 });
    seekBackward(appCore, player);
    expect(player.currentTime).toBe(30);
  });
});

describe("seekForward", () => {
  it("seeks forward by seekJumpDuration", () => {
    const appCore = new FakeAppCore({ seekJumpDuration: 10 });
    const player = new FakeMusicPlayer({ currentTime: 30, duration: 120 });
    seekForward(appCore, player);
    expect(player.currentTime).toBe(40);
    expect(appCore.getState().currentTime).toBe(40);
  });

  it("clamps to duration when step would overshoot", () => {
    const appCore = new FakeAppCore({ seekJumpDuration: 10 });
    const player = new FakeMusicPlayer({ currentTime: 115, duration: 120 });
    seekForward(appCore, player);
    expect(player.currentTime).toBe(120);
    expect(appCore.getState().currentTime).toBe(120);
  });

  it("falls back to 0 when duration is 0", () => {
    const appCore = new FakeAppCore({ seekJumpDuration: 10 });
    const player = new FakeMusicPlayer({ currentTime: 0, duration: 0 });
    seekForward(appCore, player);
    expect(player.currentTime).toBe(0);
    expect(appCore.getState().currentTime).toBe(0);
  });

  it("uses seekJumpDuration from store, not a hardcoded value", () => {
    const appCore = new FakeAppCore({ seekJumpDuration: 30 });
    const player = new FakeMusicPlayer({ currentTime: 0, duration: 120 });
    seekForward(appCore, player);
    expect(player.currentTime).toBe(30);
  });
});
