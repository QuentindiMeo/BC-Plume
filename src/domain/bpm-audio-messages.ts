/**
 * Port-level messages exchanged between the content script and the background
 * service worker over a `runtime.connect()` channel for streaming audio data
 * used in BPM detection.
 *
 * These are NOT PlumeMessages (tab-broadcast); they flow over a dedicated port.
 */

export const BPM_PORT_PREFIX = "BpmAnalyze#";

interface BpmAudioStartMessage {
  type: "BPM_AUDIO_START";
}

interface BpmAudioDataMessage {
  type: "BPM_AUDIO_DATA";
  data: number[];
}

interface BpmAudioEndMessage {
  type: "BPM_AUDIO_END";
}

interface BpmAudioErrorMessage {
  type: "BPM_AUDIO_ERROR";
  reason: string;
}

export type BpmAudioMessage = BpmAudioStartMessage | BpmAudioDataMessage | BpmAudioEndMessage | BpmAudioErrorMessage;
