import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { detectBpmForAllTracks, detectBpmForTrack } from "@/app/use-cases/detect-bpm";
import { BPM_FETCH_ACTION } from "@/domain/bpm-audio-messages";
import { CORE_ACTIONS } from "@/domain/ports/app-core";
import { FakeAppCore } from "../../fakes/FakeAppCore";

// Hoisted so the same vi.fn() references are available inside vi.mock factories
const mockSendMessage = vi.hoisted(() => vi.fn());
const mockAnalyze = vi.hoisted(() => vi.fn());

vi.mock("web-audio-beat-detector", () => ({ analyze: mockAnalyze }));
vi.mock("@/shared/browser", () => ({
  inferBrowserApi: () => ({ runtime: { sendMessage: mockSendMessage } }),
}));
vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/shared/logger", () => ({ logger: vi.fn(), CPL: { INFO: "INFO", WARN: "WARN" } }));

const TRACK_URL = "/track/my-track";
const AUDIO_URL = "https://t4.bcbits.com/stream/audio.mp3";
const FAKE_DATA = [1, 2, 3, 4];

let fakeAppCore = new FakeAppCore();
let fakeTrackAudio = makeFakeTrackAudio();

vi.mock("@/app/stores/AppCoreImpl", () => ({ getAppCoreInstance: () => fakeAppCore }));
vi.mock("@/app/stores/adapters", () => ({ getTrackAudioInstance: () => fakeTrackAudio }));

function makeFakeTrackAudio() {
  return {
    getTrackAudioInfos: vi.fn(() => [] as { trackNumber: number; trackUrl: string; audioStreamUrl: string }[]),
    getCachedBpm: vi.fn(async (_url: string) => null as number | null),
    getCachedBpms: vi.fn(async (_urls: string[]) => new Map<string, number>()),
    setCachedBpm: vi.fn(async (_url: string, _bpm: number) => {}),
  };
}

let fakeDecodeAudioData = vi.fn();
let fakeAudioContextClose = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  fakeAppCore = new FakeAppCore();
  fakeTrackAudio = makeFakeTrackAudio();

  mockSendMessage.mockResolvedValue({ ok: true, data: FAKE_DATA });
  mockAnalyze.mockResolvedValue(128);

  fakeDecodeAudioData = vi.fn().mockResolvedValue({} as AudioBuffer);
  fakeAudioContextClose = vi.fn().mockResolvedValue(undefined);
  // Must use a class/function (not arrow) so it works as a constructor with `new`
  vi.stubGlobal(
    "AudioContext",
    class {
      decodeAudioData = fakeDecodeAudioData;
      close = fakeAudioContextClose;
    } as unknown as typeof AudioContext
  );
});

afterEach(() => vi.unstubAllGlobals());

// ─── detectBpmForTrack ────────────────────────────────────────────────────────

describe("detectBpmForTrack", () => {
  it("dispatches LOADING then SUCCESS in order", async () => {
    const spy = vi.spyOn(fakeAppCore, "dispatch");
    await detectBpmForTrack(TRACK_URL, AUDIO_URL);

    expect(spy.mock.calls[0][0]).toMatchObject({ type: CORE_ACTIONS.SET_TRACK_BPM_LOADING, payload: TRACK_URL });
    expect(spy.mock.calls[1][0]).toMatchObject({ type: CORE_ACTIONS.SET_TRACK_BPM_SUCCESS });
  });

  it("stores the detected BPM in app state", async () => {
    mockAnalyze.mockResolvedValue(130.5);
    await detectBpmForTrack(TRACK_URL, AUDIO_URL);

    expect(fakeAppCore.getState().trackBpms[TRACK_URL]).toEqual({ bpm: 130.5, loading: false, error: false });
  });

  it("persists the detected BPM to cache", async () => {
    mockAnalyze.mockResolvedValue(130.5);
    await detectBpmForTrack(TRACK_URL, AUDIO_URL);

    expect(fakeTrackAudio.setCachedBpm).toHaveBeenCalledWith(TRACK_URL, 130.5);
  });

  it("sends BPM_FETCH_AUDIO to the background with the correct URL", async () => {
    await detectBpmForTrack(TRACK_URL, AUDIO_URL);

    expect(mockSendMessage).toHaveBeenCalledWith({ action: BPM_FETCH_ACTION, url: AUDIO_URL });
  });

  it("dispatches ERROR when background returns ok:false", async () => {
    mockSendMessage.mockResolvedValue({ ok: false, error: "HTTP 403" });
    await detectBpmForTrack(TRACK_URL, AUDIO_URL);

    expect(fakeAppCore.getState().trackBpms[TRACK_URL]).toEqual({ bpm: null, loading: false, error: true });
    expect(fakeTrackAudio.setCachedBpm).not.toHaveBeenCalled();
  });

  it("dispatches ERROR when sendMessage rejects", async () => {
    mockSendMessage.mockRejectedValue(new Error("Could not establish connection"));
    await detectBpmForTrack(TRACK_URL, AUDIO_URL);

    expect(fakeAppCore.getState().trackBpms[TRACK_URL]).toEqual({ bpm: null, loading: false, error: true });
  });

  it("dispatches ERROR when decodeAudioData fails", async () => {
    fakeDecodeAudioData.mockRejectedValue(new Error("Decode error"));
    await detectBpmForTrack(TRACK_URL, AUDIO_URL);

    expect(fakeAppCore.getState().trackBpms[TRACK_URL]).toEqual({ bpm: null, loading: false, error: true });
    expect(fakeTrackAudio.setCachedBpm).not.toHaveBeenCalled();
  });

  it("dispatches ERROR when beat-detector analysis throws", async () => {
    mockAnalyze.mockRejectedValue(new Error("Analysis failed"));
    await detectBpmForTrack(TRACK_URL, AUDIO_URL);

    expect(fakeAppCore.getState().trackBpms[TRACK_URL]).toEqual({ bpm: null, loading: false, error: true });
  });

  it("always closes AudioContext even when analysis fails", async () => {
    mockAnalyze.mockRejectedValue(new Error("Oops"));
    await detectBpmForTrack(TRACK_URL, AUDIO_URL);

    expect(fakeAudioContextClose).toHaveBeenCalledOnce();
  });
});

// ─── detectBpmForAllTracks ────────────────────────────────────────────────────

describe("detectBpmForAllTracks", () => {
  it("does nothing when there are no track infos", async () => {
    fakeTrackAudio.getTrackAudioInfos.mockReturnValue([]);
    await detectBpmForAllTracks();

    expect(fakeTrackAudio.getCachedBpms).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("seeds the store from cache without making network requests", async () => {
    fakeTrackAudio.getTrackAudioInfos.mockReturnValue([
      { trackNumber: 1, trackUrl: TRACK_URL, audioStreamUrl: AUDIO_URL },
    ]);
    fakeTrackAudio.getCachedBpms.mockResolvedValue(new Map([[TRACK_URL, 120]]));

    await detectBpmForAllTracks();

    expect(fakeAppCore.getState().trackBpms[TRACK_URL]).toEqual({ bpm: 120, loading: false, error: false });
    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(fakeTrackAudio.setCachedBpm).not.toHaveBeenCalled();
  });

  it("fetches and stores BPM for uncached tracks", async () => {
    fakeTrackAudio.getTrackAudioInfos.mockReturnValue([
      { trackNumber: 1, trackUrl: TRACK_URL, audioStreamUrl: AUDIO_URL },
    ]);
    fakeTrackAudio.getCachedBpms.mockResolvedValue(new Map());

    await detectBpmForAllTracks();

    expect(fakeAppCore.getState().trackBpms[TRACK_URL]).toEqual({ bpm: 128, loading: false, error: false });
    expect(fakeTrackAudio.setCachedBpm).toHaveBeenCalledWith(TRACK_URL, 128);
  });

  it("only fetches uncached tracks when some are already cached", async () => {
    const CACHED = "/track/cached";
    const UNCACHED = "/track/uncached";
    fakeTrackAudio.getTrackAudioInfos.mockReturnValue([
      { trackNumber: 1, trackUrl: CACHED, audioStreamUrl: "https://audio1.mp3" },
      { trackNumber: 2, trackUrl: UNCACHED, audioStreamUrl: "https://audio2.mp3" },
    ]);
    fakeTrackAudio.getCachedBpms.mockResolvedValue(new Map([[CACHED, 100]]));

    await detectBpmForAllTracks();

    expect(fakeAppCore.getState().trackBpms[CACHED]).toEqual({ bpm: 100, loading: false, error: false });
    expect(fakeAppCore.getState().trackBpms[UNCACHED]).toEqual({ bpm: 128, loading: false, error: false });
    expect(mockSendMessage).toHaveBeenCalledOnce();
    expect(fakeTrackAudio.setCachedBpm).toHaveBeenCalledOnce();
    expect(fakeTrackAudio.setCachedBpm).toHaveBeenCalledWith(UNCACHED, 128);
  });
});
