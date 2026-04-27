import type { TrackAudioInfo, TrackAudioPort } from "@/domain/ports/track-audio";
import { inferBrowserApi } from "@/shared/browser";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

const BPM_CACHE_PREFIX = "plume_bpm_";
const BCBITS_URL_PATTERN = /^https:\/\/\w+\.bcbits\.com/;

interface BandcampTrackEntry {
  file?: Record<string, string>;
  track_num: number;
  title_link?: string;
}

interface BandcampTrAlbum {
  trackinfo?: BandcampTrackEntry[];
}

const parseTrAlbum = (): BandcampTrAlbum | null => {
  const el = document.querySelector<HTMLElement>("[data-tralbum]");
  const raw = el?.dataset["tralbum"];
  if (!raw) {
    logger(CPL.WARN, getString("WARN__TRALBUM__NOT_FOUND"));
    return null;
  }

  try {
    return JSON.parse(raw) as BandcampTrAlbum;
  } catch {
    logger(CPL.WARN, getString("WARN__TRALBUM__PARSE_ERROR"));
    return null;
  }
};

const extractAudioUrl = (file: Record<string, string>): string | null =>
  Object.values(file).find((url) => BCBITS_URL_PATTERN.test(url)) ?? null;

export class TrackAudioAdapter implements TrackAudioPort {
  getTrackAudioInfos(): TrackAudioInfo[] {
    const trAlbum = parseTrAlbum();
    if (!trAlbum?.trackinfo) return [];

    const results: TrackAudioInfo[] = [];
    for (const entry of trAlbum.trackinfo) {
      if (!entry.title_link || !entry.file) continue;
      const audioStreamUrl = extractAudioUrl(entry.file);
      if (!audioStreamUrl) continue;

      results.push({
        trackNumber: entry.track_num,
        trackUrl: entry.title_link,
        audioStreamUrl,
      });
    }
    return results;
  }

  async getCachedBpm(trackUrl: string): Promise<number | null> {
    const key = BPM_CACHE_PREFIX + trackUrl;
    const browserApi = inferBrowserApi();
    const cache = await browserApi.storage.local.get([key]);
    const value = cache[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  async setCachedBpm(trackUrl: string, bpm: number): Promise<void> {
    const key = BPM_CACHE_PREFIX + trackUrl;
    const browserApi = inferBrowserApi();
    await browserApi.storage.local.set({ [key]: bpm });
  }

  async getCachedBpms(trackUrls: string[]): Promise<Map<string, number>> {
    const keys = trackUrls.map((url) => BPM_CACHE_PREFIX + url);
    const browserApi = inferBrowserApi();
    const cache = await browserApi.storage.local.get(keys);

    const result = new Map<string, number>();
    for (const url of trackUrls) {
      const value = cache[BPM_CACHE_PREFIX + url];
      if (typeof value === "number" && Number.isFinite(value)) {
        result.set(url, value);
      }
    }
    return result;
  }
}
