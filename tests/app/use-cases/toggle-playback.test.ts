import { togglePlayback } from "@/app/use-cases/toggle-playback";
import { FakeAppCore } from "@tests/fakes/FakeAppCore";
import { describe, expect, it } from "vitest";

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
