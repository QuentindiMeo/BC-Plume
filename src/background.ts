import type { BpmFetchRequest, BpmFetchResponse } from "@/domain/bpm-audio-messages";
import { BPM_FETCH_ACTION } from "@/domain/bpm-audio-messages";

const browserApi: typeof chrome = (globalThis as any).browser ?? (globalThis as any).chrome;

console.log("[Plume] Background service worker loaded");

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

browserApi.runtime.onMessage.addListener(
  (message: BpmFetchRequest, _sender: unknown, sendResponse: (response: BpmFetchResponse) => void): boolean => {
    if (message?.action !== BPM_FETCH_ACTION) return false;

    handleBpmFetch(message.url).then(sendResponse);
    return true; // Keep message channel open for async sendResponse (Chrome MV3 + Firefox)
  }
);
