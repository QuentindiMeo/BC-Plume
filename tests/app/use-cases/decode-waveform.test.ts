import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { decodeWaveformForCurrentTrack } from "@/app/use-cases/decode-waveform";
import { BPM_FETCH_ACTION } from "@/domain/bpm-audio-messages";
import { PLUME_CONSTANTS, PLUME_DEFAULTS } from "@/domain/plume";
import { FakeAppCore } from "../../fakes/FakeAppCore";

const { WAVEFORM_PEAK_COLUMNS } = PLUME_CONSTANTS;

const mockSendMessage = vi.hoisted(() => vi.fn());

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

function makeFakeTrackAudio(
  overrides: Partial<{ audioStreamUrl: string; trackUrl: string; trackNumber: number }> = {}
) {
  const info = {
    trackNumber: 1,
    trackUrl: overrides.trackUrl ?? TRACK_URL,
    audioStreamUrl: overrides.audioStreamUrl ?? AUDIO_URL,
  };
  return {
    getTrackAudioInfos: vi.fn(() => [info]),
  };
}

// Build a fake PCM buffer: N samples, each equal to `amplitude`.
const makeFakeSamples = (count: number, amplitude = 0.5): Float32Array => {
  const arr = new Float32Array(count);
  arr.fill(amplitude);
  return arr;
};

let fakeDecodeAudioData = vi.fn();
let fakeAudioContextClose = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  fakeAppCore = new FakeAppCore();
  fakeTrackAudio = makeFakeTrackAudio();

  mockSendMessage.mockResolvedValue({ ok: true, data: FAKE_DATA });

  fakeDecodeAudioData = vi.fn().mockResolvedValue({
    getChannelData: () => makeFakeSamples(WAVEFORM_PEAK_COLUMNS * 10),
  } as unknown as AudioBuffer);
  fakeAudioContextClose = vi.fn().mockResolvedValue(undefined);

  vi.stubGlobal(
    "AudioContext",
    class {
      decodeAudioData = fakeDecodeAudioData;
      close = fakeAudioContextClose;
    } as unknown as typeof AudioContext
  );
});

afterEach(() => vi.unstubAllGlobals());

// ─── decodeWaveformForCurrentTrack ────────────────────────────────────────────

describe("decodeWaveformForCurrentTrack", () => {
  it("returns a Float32Array with exactly WAVEFORM_PEAK_COLUMNS entries", async () => {
    const peaks = await decodeWaveformForCurrentTrack();

    expect(peaks).toBeInstanceOf(Float32Array);
    expect(peaks!.length).toBe(WAVEFORM_PEAK_COLUMNS);
  });

  it("all peak values are in the range [0, 1]", async () => {
    fakeDecodeAudioData.mockResolvedValue({
      getChannelData: () => makeFakeSamples(WAVEFORM_PEAK_COLUMNS * 10, 0.8),
    } as unknown as AudioBuffer);

    const peaks = await decodeWaveformForCurrentTrack();

    for (const p of peaks!) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it("peak values reflect the amplitude of the source samples", async () => {
    const amplitude = 0.42;
    fakeDecodeAudioData.mockResolvedValue({
      getChannelData: () => makeFakeSamples(WAVEFORM_PEAK_COLUMNS * 10, amplitude),
    } as unknown as AudioBuffer);

    const peaks = await decodeWaveformForCurrentTrack();

    expect(peaks![0]).toBeCloseTo(amplitude);
  });

  it("sends BPM_FETCH_ACTION to the background with the correct audio URL", async () => {
    await decodeWaveformForCurrentTrack();

    expect(mockSendMessage).toHaveBeenCalledWith({ action: BPM_FETCH_ACTION, url: AUDIO_URL });
  });

  it("returns null when there are no track audio infos", async () => {
    fakeTrackAudio.getTrackAudioInfos.mockReturnValue([]);

    const peaks = await decodeWaveformForCurrentTrack();

    expect(peaks).toBeNull();
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("returns null when background fetch returns ok:false", async () => {
    mockSendMessage.mockResolvedValue({ ok: false, error: "HTTP 403" });

    const peaks = await decodeWaveformForCurrentTrack();

    expect(peaks).toBeNull();
  });

  it("returns null when sendMessage rejects", async () => {
    mockSendMessage.mockRejectedValue(new Error("Network error"));

    const peaks = await decodeWaveformForCurrentTrack();

    expect(peaks).toBeNull();
  });

  it("returns null when decodeAudioData rejects", async () => {
    fakeDecodeAudioData.mockRejectedValue(new Error("Decode error"));

    const peaks = await decodeWaveformForCurrentTrack();

    expect(peaks).toBeNull();
  });

  it("always closes AudioContext even on failure", async () => {
    fakeDecodeAudioData.mockRejectedValue(new Error("Decode error"));

    await decodeWaveformForCurrentTrack();

    expect(fakeAudioContextClose).toHaveBeenCalledOnce();
  });

  it("on a collection page, resolves the current track by trackNumber from store", async () => {
    const track2 = { trackNumber: 2, trackUrl: "/track/b", audioStreamUrl: "https://audio-b.mp3" };
    fakeTrackAudio.getTrackAudioInfos.mockReturnValue([
      { trackNumber: 1, trackUrl: TRACK_URL, audioStreamUrl: AUDIO_URL },
      track2,
    ]);
    fakeAppCore = new FakeAppCore({
      featureFlags: { ...PLUME_DEFAULTS.featureFlags },
      trackNumber: "2/5",
    });

    await decodeWaveformForCurrentTrack();

    expect(mockSendMessage).toHaveBeenCalledWith({ action: BPM_FETCH_ACTION, url: track2.audioStreamUrl });
  });

  it("returns null on a collection page when trackNumber is null", async () => {
    fakeTrackAudio.getTrackAudioInfos.mockReturnValue([
      { trackNumber: 1, trackUrl: TRACK_URL, audioStreamUrl: AUDIO_URL },
      { trackNumber: 2, trackUrl: "/track/b", audioStreamUrl: "https://audio-b.mp3" },
    ]);
    // fakeAppCore defaults to trackNumber: null

    const peaks = await decodeWaveformForCurrentTrack();

    expect(peaks).toBeNull();
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("returns null on a collection page when trackNumber does not match any track", async () => {
    fakeTrackAudio.getTrackAudioInfos.mockReturnValue([
      { trackNumber: 1, trackUrl: TRACK_URL, audioStreamUrl: AUDIO_URL },
      { trackNumber: 2, trackUrl: "/track/b", audioStreamUrl: "https://audio-b.mp3" },
    ]);
    fakeAppCore = new FakeAppCore({
      featureFlags: { ...PLUME_DEFAULTS.featureFlags },
      trackNumber: "99/5",
    });

    const peaks = await decodeWaveformForCurrentTrack();

    expect(peaks).toBeNull();
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("returns null when background fetch response data is null", async () => {
    mockSendMessage.mockResolvedValue({ ok: true, data: null });

    const peaks = await decodeWaveformForCurrentTrack();

    expect(peaks).toBeNull();
  });
});
