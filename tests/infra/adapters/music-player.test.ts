import { beforeEach, describe, expect, it, vi } from "vitest";

import { MusicPlayerAdapter } from "@/infra/adapters/music-player";
import type { AudioProviderPort } from "@/domain/ports/audio-provider";

const makeAudio = (overrides: Partial<HTMLAudioElement> = {}): HTMLAudioElement =>
  ({
    currentTime: 0,
    duration: 0,
    paused: true,
    playbackRate: 1,
    volume: 1,
    loop: false,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    ...overrides,
  }) as unknown as HTMLAudioElement;

const makeAdapter = (audio: HTMLAudioElement): MusicPlayerAdapter => {
  const provider: AudioProviderPort = { getAudioElement: () => audio };
  return new MusicPlayerAdapter(provider);
};

describe("MusicPlayerAdapter — playback rate", () => {
  let audio: HTMLAudioElement;
  let adapter: MusicPlayerAdapter;

  beforeEach(() => {
    audio = makeAudio({ playbackRate: 1 });
    adapter = makeAdapter(audio);
  });

  it("getPlaybackRate returns the audio element's current playbackRate", () => {
    expect(adapter.getPlaybackRate()).toBe(1);
  });

  it("getPlaybackRate reflects changes made directly on the element", () => {
    audio.playbackRate = 1.5;
    expect(adapter.getPlaybackRate()).toBe(1.5);
  });

  it("setPlaybackRate writes to audio.playbackRate", () => {
    adapter.setPlaybackRate(2);
    expect(audio.playbackRate).toBe(2);
  });

  it("setPlaybackRate to 0.25 sets the minimum supported step", () => {
    adapter.setPlaybackRate(0.25);
    expect(audio.playbackRate).toBe(0.25);
  });

  it("setPlaybackRate and getPlaybackRate round-trip correctly", () => {
    adapter.setPlaybackRate(1.5);
    expect(adapter.getPlaybackRate()).toBe(1.5);
  });
});
