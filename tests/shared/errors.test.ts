import { describe, expect, it } from "vitest";

import {
  AdapterNotRegisteredError,
  AudioFetchError,
  BrowserApiError,
  HttpFetchError,
  UnhandledActionError,
} from "@/shared/errors";

describe("HttpFetchError", () => {
  it("embeds status and url in the message and sets name", () => {
    const err = new HttpFetchError(404, "https://example.com/audio.mp3");

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("HttpFetchError");
    expect(err.message).toBe("HTTP 404 for https://example.com/audio.mp3");
  });
});

describe("BrowserApiError", () => {
  it("describes the missing browser API in the message", () => {
    const err = new BrowserApiError();

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("BrowserApiError");
    expect(err.message).toMatch(/browser API/);
  });
});

describe("UnhandledActionError", () => {
  it("serializes the offending action into the message", () => {
    // simulate a reducer hitting an action whose type was never wired up
    const stray = { type: "MYSTERY_ACTION", payload: 42 } as never;
    const err = new UnhandledActionError(stray);

    expect(err.name).toBe("UnhandledActionError");
    expect(err.message).toContain('"type":"MYSTERY_ACTION"');
    expect(err.message).toContain('"payload":42');
  });
});

describe("AdapterNotRegisteredError", () => {
  it("names the adapter and its registration function in the message", () => {
    const err = new AdapterNotRegisteredError("BcPlayerPort", "registerBcPlayer");

    expect(err.name).toBe("AdapterNotRegisteredError");
    expect(err.message).toBe("BcPlayerPort not registered — call registerBcPlayer() first.");
  });
});

describe("AudioFetchError", () => {
  it("passes the message through unchanged and sets name", () => {
    const err = new AudioFetchError("Background audio fetch failed");

    expect(err.name).toBe("AudioFetchError");
    expect(err.message).toBe("Background audio fetch failed");
  });
});
