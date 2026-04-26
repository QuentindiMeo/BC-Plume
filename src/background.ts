import { BPM_PORT_PREFIX } from "@/domain/bpm-audio-messages";

const CHUNK_SIZE = 1024 * 1024 * 16; // 16 MB

const browserApi: typeof chrome = (globalThis as any).browser ?? (globalThis as any).chrome;

browserApi.runtime.onConnect.addListener((port) => {
  if (!port.name.startsWith(BPM_PORT_PREFIX)) return;

  const url = port.name.slice(BPM_PORT_PREFIX.length);

  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      return response.arrayBuffer();
    })
    .then((buffer) => {
      port.postMessage({ type: "BPM_AUDIO_START" });

      for (let offset = 0; offset < buffer.byteLength; offset += CHUNK_SIZE) {
        const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
        port.postMessage({
          type: "BPM_AUDIO_DATA",
          data: Array.from(new Uint8Array(chunk)),
        });
      }

      port.postMessage({ type: "BPM_AUDIO_END" });
    })
    .catch((error) => {
      port.postMessage({
        type: "BPM_AUDIO_ERROR",
        reason: error instanceof Error ? error.message : String(error),
      });
    });
});
