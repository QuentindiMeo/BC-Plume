/**
 * Messages exchanged between the content script and the background service
 * worker via `runtime.sendMessage` / `onMessage` for fetching cross-origin
 * audio data used in BPM detection.
 */

export const BPM_FETCH_ACTION = "BPM_FETCH_AUDIO";

export interface BpmFetchRequest {
  action: typeof BPM_FETCH_ACTION;
  url: string;
}

export interface BpmFetchResponse {
  ok: boolean;
  data?: number[];
  error?: string;
}
