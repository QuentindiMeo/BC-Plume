import { inferBrowserApi } from "@/shared/browser";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllGlobals());

describe("inferBrowserApi", () => {
  it("throws when neither browser nor chrome is available", () => {
    vi.stubGlobal("browser", undefined);
    vi.stubGlobal("chrome", undefined);
    expect(() => inferBrowserApi()).toThrow("No compatible browser API");
  });

  it("returns chrome when only chrome is available", () => {
    const fakeChrome = { storage: {} };
    vi.stubGlobal("browser", undefined);
    vi.stubGlobal("chrome", fakeChrome);
    expect(inferBrowserApi()).toBe(fakeChrome);
  });

  it("prefers browser over chrome when both are available (Firefox-first)", () => {
    const fakeBrowser = { storage: {} };
    const fakeChrome = { storage: {} };
    vi.stubGlobal("browser", fakeBrowser);
    vi.stubGlobal("chrome", fakeChrome);
    expect(inferBrowserApi()).toBe(fakeBrowser);
  });
});
