// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockStorage: Record<string, unknown> = {};
vi.mock("@/shared/browser", () => ({
  inferBrowserApi: () => ({
    storage: {
      local: {
        get: vi.fn((keys: string[]) => {
          const result: Record<string, unknown> = {};
          for (const k of keys) {
            if (k in mockStorage) result[k] = mockStorage[k];
          }
          return Promise.resolve(result);
        }),
        set: vi.fn((items: Record<string, unknown>) => {
          Object.assign(mockStorage, items);
          return Promise.resolve();
        }),
      },
    },
  }),
}));
vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/shared/logger", () => ({ CPL: { WARN: "warn" }, logger: vi.fn() }));

import { logger } from "@/shared/logger";
import { TrackAudioAdapter } from "@/infra/adapters/track-audio";

describe("TrackAudioAdapter", () => {
  let adapter: TrackAudioAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new TrackAudioAdapter();
    document.body.innerHTML = "";
    for (const key of Object.keys(mockStorage)) delete mockStorage[key];
  });

  const setTralbum = (data: object): void => {
    const el = document.createElement("div");
    el.dataset["tralbum"] = JSON.stringify(data);
    document.body.appendChild(el);
  };

  describe("getTrackAudioInfos", () => {
    it("returns empty array when no data-tralbum element exists", () => {
      expect(adapter.getTrackAudioInfos()).toEqual([]);
    });

    it("parses track entries from data-tralbum", () => {
      setTralbum({
        trackinfo: [
          {
            track_num: 1,
            title_link: "/track/song-one",
            file: { "mp3-128": "https://t4.bcbits.com/stream/abc123" },
          },
          {
            track_num: 2,
            title_link: "/track/song-two",
            file: { "mp3-128": "https://t4.bcbits.com/stream/def456" },
          },
        ],
      });

      const infos = adapter.getTrackAudioInfos();
      expect(infos).toHaveLength(2);
      expect(infos[0]).toEqual({
        trackNumber: 1,
        trackUrl: "/track/song-one",
        audioStreamUrl: "https://t4.bcbits.com/stream/abc123",
      });
      expect(infos[1]).toEqual({
        trackNumber: 2,
        trackUrl: "/track/song-two",
        audioStreamUrl: "https://t4.bcbits.com/stream/def456",
      });
    });

    it("skips entries without title_link or file", () => {
      setTralbum({
        trackinfo: [
          { track_num: 1, file: { "mp3-128": "https://t4.bcbits.com/stream/abc" } },
          { track_num: 2, title_link: "/track/no-audio" },
          {
            track_num: 3,
            title_link: "/track/valid",
            file: { "mp3-128": "https://t4.bcbits.com/stream/valid" },
          },
        ],
      });

      const infos = adapter.getTrackAudioInfos();
      expect(infos).toHaveLength(1);
      expect(infos[0].trackNumber).toBe(3);
    });

    it("skips entries with non-bcbits URLs", () => {
      setTralbum({
        trackinfo: [
          {
            track_num: 1,
            title_link: "/track/other",
            file: { "mp3-128": "https://example.com/audio.mp3" },
          },
        ],
      });

      expect(adapter.getTrackAudioInfos()).toEqual([]);
    });

    it("returns empty when data-tralbum JSON is invalid", () => {
      const el = document.createElement("div");
      el.dataset["tralbum"] = "not-valid-json";
      document.body.appendChild(el);

      expect(adapter.getTrackAudioInfos()).toEqual([]);
    });

    it("logs the missing-element warning only once across repeated calls", () => {
      adapter.getTrackAudioInfos();
      adapter.getTrackAudioInfos();
      adapter.getTrackAudioInfos();
      expect(vi.mocked(logger)).toHaveBeenCalledOnce();
    });

    it("returns consistent results from the cached parse on repeated calls", () => {
      setTralbum({
        trackinfo: [{ track_num: 1, title_link: "/track/a", file: { "mp3-128": "https://t4.bcbits.com/stream/x" } }],
      });
      expect(adapter.getTrackAudioInfos()).toEqual(adapter.getTrackAudioInfos());
    });
  });

  describe("getCachedBpm / setCachedBpm", () => {
    it("returns null for uncached track", async () => {
      const result = await adapter.getCachedBpm("/track/unknown");
      expect(result).toBeNull();
    });

    it("returns the cached BPM after setting it", async () => {
      await adapter.setCachedBpm("/track/test", 128);
      const result = await adapter.getCachedBpm("/track/test");
      expect(result).toBe(128);
    });

    it("returns null for non-number cached values", async () => {
      mockStorage["plume_bpm_/track/bad"] = "not-a-number";
      const result = await adapter.getCachedBpm("/track/bad");
      expect(result).toBeNull();
    });
  });

  describe("getCachedBpms", () => {
    it("returns a map of cached BPMs", async () => {
      await adapter.setCachedBpm("/track/a", 120);
      await adapter.setCachedBpm("/track/b", 140);

      const result = await adapter.getCachedBpms(["/track/a", "/track/b", "/track/c"]);
      expect(result.size).toBe(2);
      expect(result.get("/track/a")).toBe(120);
      expect(result.get("/track/b")).toBe(140);
      expect(result.has("/track/c")).toBe(false);
    });

    it("returns empty map when no values are cached", async () => {
      const result = await adapter.getCachedBpms(["/track/x"]);
      expect(result.size).toBe(0);
    });
  });
});
