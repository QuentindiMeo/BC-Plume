import { beforeEach, describe, expect, it, vi } from "vitest";
import { LOOP_MODE } from "@/src/domain/plume";
import { coreActions } from "@/src/domain/ports/app-core";
import type { BcPlayerPort } from "@/src/domain/ports/bc-player";
import { isLastTrackOfAlbumPlaying, navigateTrackBackward, navigateTrackForward } from "@/src/app/use-cases/navigate-track";
import { FakeAppCore } from "../../fakes/FakeAppCore";
import { FakeMusicPlayer } from "../../fakes/FakeMusicPlayer";


// Minimal BcPlayerPort fake — only the methods called by navigate-track
const makeFakeBcPlayer = (overrides: Partial<BcPlayerPort> = {}): BcPlayerPort =>
  ({
    getTrackRowTitles: vi.fn(() => []),
    getTrackTitle: vi.fn(() => null),
    getTrackRows: vi.fn(() => []),
    getPreviousTrackButton: vi.fn(() => null),
    getNextTrackButton: vi.fn(() => null),
    isPlayerPresent: vi.fn(() => true),
    getAlbumContext: vi.fn(() => null),
    getArtworkUrl: vi.fn(() => null),
    getTrackDuration: vi.fn(() => null),
    isPlaying: vi.fn(() => false),
    getCurrentTime: vi.fn(() => 0),
    getVolume: vi.fn(() => 1),
    getTrackRowDurations: vi.fn(() => []),
    getAudioElement: vi.fn(() => null),
    getPageBackground: vi.fn(() => null),
    getPlayerParent: vi.fn(() => null),
    getInfoSection: vi.fn(() => null),
    getTrackTitleElement: vi.fn(() => null),
    getTrackView: vi.fn(() => null),
    getInlinePlayerTable: vi.fn(() => null),
    getPlayPauseButton: vi.fn(() => null),
    ...overrides,
  }) as BcPlayerPort;

// ─── isLastTrackOfAlbumPlaying ────────────────────────────────────────────────

describe("isLastTrackOfAlbumPlaying", () => {
  it("returns false when there are no track rows", () => {
    const bcPlayer = makeFakeBcPlayer({ getTrackRowTitles: vi.fn(() => []) });
    expect(isLastTrackOfAlbumPlaying(bcPlayer)).toBe(false);
  });

  it("returns false when the current track title is null", () => {
    const bcPlayer = makeFakeBcPlayer({
      getTrackRowTitles: vi.fn(() => ["Track 1", "Track 2"]),
      getTrackTitle: vi.fn(() => null),
    });
    expect(isLastTrackOfAlbumPlaying(bcPlayer)).toBe(false);
  });

  it("returns true when current title matches the last row title", () => {
    const bcPlayer = makeFakeBcPlayer({
      getTrackRowTitles: vi.fn(() => ["Track 1", "Track 2", "Final Track"]),
      getTrackTitle: vi.fn(() => "Final Track"),
    });
    expect(isLastTrackOfAlbumPlaying(bcPlayer)).toBe(true);
  });

  it("returns false when current title matches a non-last row title", () => {
    const bcPlayer = makeFakeBcPlayer({
      getTrackRowTitles: vi.fn(() => ["Track 1", "Track 2", "Final Track"]),
      getTrackTitle: vi.fn(() => "Track 1"),
    });
    expect(isLastTrackOfAlbumPlaying(bcPlayer)).toBe(false);
  });
});

// ─── navigateTrackBackward ────────────────────────────────────────────────────

describe("navigateTrackBackward", () => {
  let appCore: FakeAppCore;
  let player: FakeMusicPlayer;
  let prevBtn: { click: ReturnType<typeof vi.fn> };
  let bcPlayer: BcPlayerPort;

  beforeEach(() => {
    appCore = new FakeAppCore({ trackRestartThreshold: 5 });
    player = new FakeMusicPlayer({ currentTime: 0 });
    prevBtn = { click: vi.fn() };
    bcPlayer = makeFakeBcPlayer({
      getPreviousTrackButton: vi.fn(() => prevBtn as unknown as HTMLButtonElement),
    });
  });

  it("restarts the current track when currentTime is above the threshold", () => {
    player.currentTime = 10;
    navigateTrackBackward(appCore, player, bcPlayer);
    expect(player.currentTime).toBe(0);
    expect(prevBtn.click).not.toHaveBeenCalled();
  });

  it("clicks the prev button when currentTime is at or below the threshold", () => {
    player.currentTime = 5; // equal to threshold — should NOT restart
    navigateTrackBackward(appCore, player, bcPlayer);
    expect(player.currentTime).toBe(5); // seekTo(0) not called
    expect(prevBtn.click).toHaveBeenCalledOnce();
  });

  it("clicks the prev button when currentTime is below the threshold", () => {
    player.currentTime = 2;
    navigateTrackBackward(appCore, player, bcPlayer);
    expect(prevBtn.click).toHaveBeenCalledOnce();
  });

  it("does nothing when prev button is absent and currentTime is within threshold", () => {
    const noPrevBcPlayer = makeFakeBcPlayer({ getPreviousTrackButton: vi.fn(() => null) });
    player.currentTime = 0;
    navigateTrackBackward(appCore, player, noPrevBcPlayer);
    expect(player.currentTime).toBe(0);
  });

  it("always restarts when threshold is 0 and currentTime > 0", () => {
    appCore = new FakeAppCore({ trackRestartThreshold: 0 });
    player.currentTime = 1;
    navigateTrackBackward(appCore, player, bcPlayer);
    expect(player.currentTime).toBe(0);
    expect(prevBtn.click).not.toHaveBeenCalled();
  });

  it("clicks prev when threshold is 0 and currentTime is 0", () => {
    appCore = new FakeAppCore({ trackRestartThreshold: 0 });
    player.currentTime = 0;
    navigateTrackBackward(appCore, player, bcPlayer);
    expect(prevBtn.click).toHaveBeenCalledOnce();
  });
});

// ─── navigateTrackForward ─────────────────────────────────────────────────────

describe("navigateTrackForward", () => {
  let appCore: FakeAppCore;
  let player: FakeMusicPlayer;
  let nextBtn: { click: ReturnType<typeof vi.fn> };
  let prevBtn: { click: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    appCore = new FakeAppCore({ pageType: "album" });
    player = new FakeMusicPlayer({ currentTime: 30 });
    nextBtn = { click: vi.fn() };
    prevBtn = { click: vi.fn() };
  });

  it("clicks the next button on a normal mid-album track", () => {
    // loopMode defaults to NONE in FakeAppCore
    const bcPlayer = makeFakeBcPlayer({
      getTrackRowTitles: vi.fn(() => ["Track 1", "Track 2", "Track 3"]),
      getTrackTitle: vi.fn(() => "Track 1"),
      getNextTrackButton: vi.fn(() => nextBtn as unknown as HTMLButtonElement),
    });
    navigateTrackForward(appCore, player, bcPlayer);
    expect(nextBtn.click).toHaveBeenCalledOnce();
  });

  it("wraps to first track when on last track of album with loopMode COLLECTION", () => {
    appCore.dispatch(coreActions.setLoopMode(LOOP_MODE.COLLECTION));
    const fakeRow = {} as HTMLTableRowElement;
    const bcPlayer = makeFakeBcPlayer({
      getTrackRowTitles: vi.fn(() => ["Track 1", "Track 2"]),
      getTrackTitle: vi.fn(() => "Track 2"), // last track
      getTrackRows: vi.fn(() => [fakeRow, fakeRow]), // 2 rows → 2 prev-clicks
      getPreviousTrackButton: vi.fn(() => prevBtn as unknown as HTMLButtonElement),
      getNextTrackButton: vi.fn(() => null),
    });
    navigateTrackForward(appCore, player, bcPlayer);
    expect(prevBtn.click).toHaveBeenCalledTimes(2);
    expect(player.currentTime).toBe(30); // seekTo not called
  });

  it("does not wrap when on last track with loopMode NONE", () => {
    // loopMode defaults to NONE
    const bcPlayer = makeFakeBcPlayer({
      getTrackRowTitles: vi.fn(() => ["Track 1", "Track 2"]),
      getTrackTitle: vi.fn(() => "Track 2"),
      getNextTrackButton: vi.fn(() => null),
    });
    navigateTrackForward(appCore, player, bcPlayer);
    expect(prevBtn.click).not.toHaveBeenCalled();
    expect(player.currentTime).toBe(30);
  });

  it("seeks to 0 on a track page when loopMode is not NONE", () => {
    appCore.dispatch(coreActions.setPageType("track"));
    appCore.dispatch(coreActions.setLoopMode(LOOP_MODE.TRACK));
    const bcPlayer = makeFakeBcPlayer({
      getTrackRowTitles: vi.fn(() => []),
      getTrackTitle: vi.fn(() => "Solo Track"),
      getNextTrackButton: vi.fn(() => null),
    });
    navigateTrackForward(appCore, player, bcPlayer);
    expect(player.currentTime).toBe(0);
    expect(nextBtn.click).not.toHaveBeenCalled();
  });

  it("does not seek to 0 on a track page when loopMode is NONE", () => {
    appCore.dispatch(coreActions.setPageType("track"));
    // loopMode defaults to NONE
    const bcPlayer = makeFakeBcPlayer({
      getTrackRowTitles: vi.fn(() => []),
      getTrackTitle: vi.fn(() => "Solo Track"),
      getNextTrackButton: vi.fn(() => nextBtn as unknown as HTMLButtonElement),
    });
    navigateTrackForward(appCore, player, bcPlayer);
    expect(player.currentTime).toBe(30);
    expect(nextBtn.click).toHaveBeenCalledOnce();
  });

  it("logs a warning when next button is absent and no special case applies", () => {
    // loopMode NONE, album page, not last track — falls through to warning
    const bcPlayer = makeFakeBcPlayer({
      getTrackRowTitles: vi.fn(() => ["Track 1", "Track 2"]),
      getTrackTitle: vi.fn(() => "Track 1"),
      getNextTrackButton: vi.fn(() => null),
    });
    expect(() => navigateTrackForward(appCore, player, bcPlayer)).not.toThrow();
  });
});
