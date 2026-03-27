import { togglePlayback } from "@/src/app/use-cases/toggle-playback";
import { describe, expect, it } from "vitest";
import { FakeAppCore } from "../../fakes/FakeAppCore";

describe("togglePlayback", () => {
  it("starts playback when paused", () => {
    const appCore = new FakeAppCore({ isPlaying: false });
    togglePlayback(appCore);
    expect(appCore.getState().isPlaying).toBe(true);
  });

  it("pauses playback when playing", () => {
    const appCore = new FakeAppCore({ isPlaying: true });
    togglePlayback(appCore);
    expect(appCore.getState().isPlaying).toBe(false);
  });
});
