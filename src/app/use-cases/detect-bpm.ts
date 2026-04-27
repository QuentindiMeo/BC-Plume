import { getTrackAudioInstance } from "@/app/stores/adapters";
import { getAppCoreInstance } from "@/app/stores/AppCoreImpl";
import { BPM_PORT_PREFIX, type BpmAudioMessage } from "@/domain/bpm-audio-messages";
import { coreActions } from "@/domain/ports/app-core";
import { inferBrowserApi } from "@/shared/browser";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

const mergeChunks = (chunks: Uint8Array[]): Uint8Array => {
  let length = 0;
  for (const chunk of chunks) length += chunk.length;
  const merged = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
};

const fetchAudioViaBackground = (audioStreamUrl: string): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const browserApi = inferBrowserApi();
    let port: ReturnType<typeof browserApi.runtime.connect>;
    try {
      port = browserApi.runtime.connect({ name: BPM_PORT_PREFIX + audioStreamUrl });
    } catch (error) {
      reject(new Error("Failed to connect to background worker"));
      return;
    }
    const chunks: Uint8Array[] = [];
    let settled = false;

    const cleanup = () => {
      port.onMessage.removeListener(onMessage);
      try {
        port.disconnect();
      } catch {
        // Port may already be disconnected
      }
    };

    const onDisconnect = () => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error("Background port disconnected unexpectedly"));
      }
    };

    const onMessage = (message: BpmAudioMessage) => {
      switch (message.type) {
        case "BPM_AUDIO_START":
          break;
        case "BPM_AUDIO_DATA":
          chunks.push(new Uint8Array(message.data));
          break;
        case "BPM_AUDIO_END":
          settled = true;
          cleanup();
          resolve(mergeChunks(chunks).buffer as ArrayBuffer);
          break;
        case "BPM_AUDIO_ERROR":
          settled = true;
          cleanup();
          reject(new Error(message.reason));
          break;
      }
    };
    port.onMessage.addListener(onMessage);
    port.onDisconnect?.addListener(onDisconnect);
  });

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
