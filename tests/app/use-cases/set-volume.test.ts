import { setVolume } from "@/src/app/use-cases/set-volume";
import { FakeAppCore } from "@/tests/fakes/FakeAppCore";
import { describe, expect, it } from "vitest";

describe("setVolume", () => {
  it("normalizes raw slider value to [0..1]", () => {
    const appCore = new FakeAppCore({ isMuted: false });
    setVolume(50, appCore);
    expect(appCore.getState().volume).toBe(0.5);
  });

  it("unmutes and sets volume when muted and slider is above 0", () => {
    const appCore = new FakeAppCore({ isMuted: true, volume: 0 });
    setVolume(50, appCore);
    expect(appCore.getState().isMuted).toBe(false);
    expect(appCore.getState().volume).toBe(0.5);
  });

  it("does not unmute when slider is 0, even if muted", () => {
    const appCore = new FakeAppCore({ isMuted: true });
    setVolume(0, appCore);
    expect(appCore.getState().isMuted).toBe(true);
    expect(appCore.getState().volume).toBe(0);
  });
});
