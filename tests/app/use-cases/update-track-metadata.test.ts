import { updateTrackMetadata } from "@/app/use-cases/update-track-metadata";
import { describe, expect, it } from "vitest";
import { FakeAppCore } from "../../fakes/FakeAppCore";
import { fakeBcPlayer } from "../../fakes/FakeBcPlayer";

describe("updateTrackMetadata", () => {
  it("album page: stores track title and current/total pattern in state", () => {
    const appCore = new FakeAppCore({ pageType: "album" });
    const bcPlayer = fakeBcPlayer("Album Track");

    const result = updateTrackMetadata(appCore, bcPlayer);

    expect(appCore.getState().trackTitle).toBe("Album Track");
    expect(appCore.getState().trackNumber).toContain("0/0");
    expect(result.trackTitle).toBe("Album Track");
    expect(result.current).toBe(0);
    expect(result.total).toBe(0);
  });

  it("track page: stores generic LABEL__TRACK string (no current/total)", () => {
    const appCore = new FakeAppCore({ pageType: "track" });
    const bcPlayer = fakeBcPlayer("Solo Track");

    const result = updateTrackMetadata(appCore, bcPlayer);

    expect(appCore.getState().trackNumber).toBe("currently playing:");
    expect(result.trackNumberText).toBe("currently playing:");
  });

  it("null title: stores LABEL__TRACK_UNKNOWN fallback as track title", () => {
    const appCore = new FakeAppCore({ pageType: "album" });
    const bcPlayer = fakeBcPlayer(null);

    const result = updateTrackMetadata(appCore, bcPlayer);

    expect(appCore.getState().trackTitle).toBe("unknown track");
    expect(result.trackTitle).toBe("unknown track");
  });

  it("empty track rows: returns current=0 and total=0", () => {
    const appCore = new FakeAppCore({ pageType: "album" });
    const bcPlayer = fakeBcPlayer();

    const result = updateTrackMetadata(appCore, bcPlayer);

    expect(result.current).toBe(0);
    expect(result.total).toBe(0);
  });
});
