import { inferBrowserApi, isSafariBrowser, logDetectedBrowser } from "@/shared/browser";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllGlobals());

describe("isSafariBrowser", () => {
  it("returns true when navigator.vendor starts with 'Apple'", () => {
    vi.stubGlobal("navigator", { vendor: "Apple Computer, Inc." });
    expect(isSafariBrowser()).toBe(true);
  });

  it("returns false when navigator.vendor is 'Google Inc.' (Chrome)", () => {
    vi.stubGlobal("navigator", { vendor: "Google Inc." });
    expect(isSafariBrowser()).toBe(false);
  });

  it("returns false when navigator.vendor is empty string (Firefox)", () => {
    vi.stubGlobal("navigator", { vendor: "" });
    expect(isSafariBrowser()).toBe(false);
  });
});

describe("logDetectedBrowser", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("logs Firefox-based when no chrome global is present", () => {
    vi.stubGlobal("chrome", undefined);
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    logDetectedBrowser();
    expect(infoSpy.mock.calls[0]).toContain("Firefox-based");
    infoSpy.mockRestore();
  });

  it("logs Chromium-based when only chrome is present", () => {
    vi.stubGlobal("chrome", { i18n: {} });
    vi.stubGlobal("browser", undefined);
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    logDetectedBrowser();
    expect(infoSpy.mock.calls[0]).toContain("Chromium-based");
    infoSpy.mockRestore();
  });
});

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
