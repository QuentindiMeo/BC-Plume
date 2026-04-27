import type { BpmFetchRequest, BpmFetchResponse } from "@/domain/bpm-audio-messages";
import { BPM_FETCH_ACTION } from "@/domain/bpm-audio-messages";
import { inferBrowserApi } from "@/shared/browser";

const handleBpmFetch = async (url: string): Promise<BpmFetchResponse> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);

    const buffer = await response.arrayBuffer();
    return { ok: true, data: Array.from(new Uint8Array(buffer)) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
};

console.log("[Plume] Background service worker loaded");
const browserApi = inferBrowserApi();
browserApi.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const req = message as BpmFetchRequest;
  if (req?.action !== BPM_FETCH_ACTION) return false;

  handleBpmFetch(req.url).then(sendResponse as (response: BpmFetchResponse) => void);
  return true; // Keep message channel open for async sendResponse (Chrome MV3 + Firefox)
});
