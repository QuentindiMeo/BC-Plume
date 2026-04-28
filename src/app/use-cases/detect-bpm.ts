import { getTrackAudioInstance } from "@/app/stores/adapters";
import { getAppCoreInstance } from "@/app/stores/AppCoreImpl";
import { BPM_FETCH_ACTION, type BpmFetchResponse } from "@/domain/bpm-audio-messages";
import { coreActions } from "@/domain/ports/app-core";
import { inferBrowserApi } from "@/shared/browser";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

const fetchAudioViaBackground = async (audioStreamUrl: string): Promise<ArrayBuffer> => {
  const browserApi = inferBrowserApi();
  const response = (await browserApi.runtime.sendMessage({
    action: BPM_FETCH_ACTION,
    url: audioStreamUrl,
  })) as BpmFetchResponse;

  if (!response?.ok || !response.data) {
    throw new Error(response?.error ?? "Background audio fetch failed");
  }

  return new Uint8Array(response.data).buffer as ArrayBuffer;
};

const analyzeAudioBuffer = async (buffer: ArrayBuffer): Promise<number> => {
  const audioContext = new AudioContext();
  try {
    const decodedAudio = await audioContext.decodeAudioData(buffer);
    const { analyze } = await import("web-audio-beat-detector");
    return await analyze(decodedAudio);
  } finally {
    await audioContext.close();
  }
};

export const detectBpmForTrack = async (trackUrl: string, audioStreamUrl: string): Promise<void> => {
  const appCore = getAppCoreInstance();
  const trackAudio = getTrackAudioInstance();

  appCore.dispatch(coreActions.setTrackBpmLoading(trackUrl));
  logger(CPL.INFO, getString("INFO__BPM__DETECT_START", [trackUrl]));

  try {
    const buffer = await fetchAudioViaBackground(audioStreamUrl);
    const bpm = await analyzeAudioBuffer(buffer);

    appCore.dispatch(coreActions.setTrackBpmSuccess(trackUrl, bpm));
    await trackAudio.setCachedBpm(trackUrl, bpm);
    logger(CPL.INFO, getString("INFO__BPM__DETECT_SUCCESS", [String(Math.round(bpm * 10) / 10), trackUrl]));
  } catch (error) {
    appCore.dispatch(coreActions.setTrackBpmError(trackUrl));
    logger(CPL.WARN, getString("WARN__BPM__DETECT_FAILED", [trackUrl]), error);
  }
};

export const detectBpmForAllTracks = async (): Promise<void> => {
  const appCore = getAppCoreInstance();
  const trackAudio = getTrackAudioInstance();

  const infos = trackAudio.getTrackAudioInfos();
  if (infos.length === 0) return;

  const trackUrls = infos.map((info) => info.trackUrl);
  const cached = await trackAudio.getCachedBpms(trackUrls);

  // Seed store with cached BPMs
  for (const [url, bpm] of cached) {
    appCore.dispatch(coreActions.setTrackBpmSuccess(url, bpm));
  }

  // Detect BPM for tracks that don't have a cached value (sequential to avoid overwhelming the worker)
  const uncached = infos.filter((info) => !cached.has(info.trackUrl));
  for (const info of uncached) {
    await detectBpmForTrack(info.trackUrl, info.audioStreamUrl);
  }
};
