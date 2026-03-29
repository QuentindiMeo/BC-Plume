import { getString, logDetectedBrowser } from "@/shared/i18n";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("getString", () => {
  it("resolves placeholders using the substitutions array", () => {
    const result = getString("LABEL__TRACK_CURRENT", ["3/10"]);
    expect(result).toBe("currently playing (3/10):");
  });

  it("returns the key and warns when the key does not exist", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = getString("KEY_THAT_DOES_NOT_EXIST");
    expect(result).toBe("KEY_THAT_DOES_NOT_EXIST");
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("getString (browser i18n live path)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("returns browser API result when getMessage returns a non-empty string", async () => {
    vi.stubGlobal("browser", { i18n: { getMessage: () => "from browser" } });
    vi.resetModules();
    const { getString: getStringFresh } = await import("@/shared/i18n");
    expect(getStringFresh("LABEL__TRACK")).toBe("from browser");
  });

  it("falls back to EN messages when getMessage returns an empty string", async () => {
    vi.stubGlobal("chrome", { i18n: { getMessage: () => "" } });
    vi.resetModules();
    const { getString: getStringFresh } = await import("@/shared/i18n");
    expect(getStringFresh("LABEL__TRACK")).toBe("currently playing:");
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
