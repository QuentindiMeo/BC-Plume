import { getTrackAudioInstance } from "@/app/stores/adapters";
import { getAppCoreInstance } from "@/app/stores/AppCoreImpl";
import { BPM_FETCH_ACTION, type BpmFetchResponse } from "@/domain/bpm-audio-messages";
import { PLUME_CONSTANTS } from "@/domain/plume";
import type { TrackAudioInfo } from "@/domain/ports/track-audio";
import { inferBrowserApi } from "@/shared/browser";
import { AudioFetchError } from "@/shared/errors";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

const fetchAudioViaBackground = async (audioStreamUrl: string): Promise<ArrayBuffer> => {
  const browserApi = inferBrowserApi();
  const response = (await browserApi.runtime.sendMessage({
    action: BPM_FETCH_ACTION,
    url: audioStreamUrl,
  })) as BpmFetchResponse;

  if (!response?.ok || !response.data) {
    throw new AudioFetchError(response?.error ?? "Background audio fetch failed");
  }

  return new Uint8Array(response.data).buffer as ArrayBuffer;
};

const downsampleToPeaks = (samples: Float32Array, peakCount: number): Float32Array => {
  const peaks = new Float32Array(peakCount);
  const bucketSize = Math.floor(samples.length / peakCount);

  for (let i = 0; i < peakCount; i++) {
    const start = i * bucketSize;
    const end = start + bucketSize;
    let peak = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(samples[j] as number);
      if (abs > peak) peak = abs;
    }
    peaks[i] = peak;
  }

  return peaks;
};

const resolveCurrentTrackAudioInfo = (infos: TrackAudioInfo[]): TrackAudioInfo | null => {
  if (infos.length === 1) return infos[0] ?? null;

  const trackNumberText = getAppCoreInstance().getState().trackNumber;
  if (!trackNumberText) return null;

  const match = trackNumberText.match(/(\d+)/);
  if (!match) return null;

  const currentNum = Number(match[1]);
  return infos.find((info) => info.trackNumber === currentNum) ?? null;
};

export const decodeWaveformForCurrentTrack = async (): Promise<Float32Array | null> => {
  const trackAudio = getTrackAudioInstance();
  const infos = trackAudio.getTrackAudioInfos();
  const currentInfo: TrackAudioInfo | null = resolveCurrentTrackAudioInfo(infos);

  if (!currentInfo?.audioStreamUrl) return null;

  const { audioStreamUrl, trackUrl } = currentInfo;
  logger(CPL.INFO, getString("INFO__WAVEFORM__DECODE_START", [trackUrl]));

  const audioContext = new AudioContext();
  try {
    const buffer = await fetchAudioViaBackground(audioStreamUrl);
    const audioBuffer = await audioContext.decodeAudioData(buffer);
    const samples = audioBuffer.getChannelData(0);
    const peaks = downsampleToPeaks(samples, PLUME_CONSTANTS.WAVEFORM_PEAK_COLUMNS);

    logger(CPL.INFO, getString("INFO__WAVEFORM__DECODE_SUCCESS", [trackUrl]));
    return peaks;
  } catch (error) {
    logger(CPL.WARN, getString("WARN__WAVEFORM__DECODE_FAILED", [trackUrl]), error);
    return null;
  } finally {
    await audioContext.close();
  }
};
