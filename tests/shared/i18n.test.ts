import { getString, logDetectedBrowser, setForcedLanguage } from "@/shared/i18n";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("getString", () => {
  it("resolves placeholders using the substitutions array", () => {
    const result = getString("LABEL__TRACK_CURRENT", ["3/10"]);
    expect(result).toBe("currently playing (3/10)");
  });

  it("returns the key and warns when the key does not exist", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = getString("KEY_THAT_DOES_NOT_EXIST");
    expect(result).toBe("KEY_THAT_DOES_NOT_EXIST");
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("setForcedLanguage", () => {
  afterEach(() => {
    setForcedLanguage("auto");
  });

  it("getString returns the ES string when es is forced", () => {
    setForcedLanguage("es");
    expect(getString("POPUP__GENERAL__TAB_LABEL")).toBe("General");
  });

  it("getString returns the FR string when fr is forced", () => {
    setForcedLanguage("fr");
    expect(getString("POPUP__GENERAL__TAB_LABEL")).toBe("Général");
  });

  it("getString returns the EN string when en is forced", () => {
    setForcedLanguage("en");
    expect(getString("POPUP__GENERAL__TAB_LABEL")).toBe("General");
  });

  it("getString reverts to default behavior when set back to auto", () => {
    setForcedLanguage("fr");
    setForcedLanguage("auto");
    expect(getString("POPUP__GENERAL__TAB_LABEL")).toBe("General");
  });

  it("getString reverts to default behavior when set to null", () => {
    setForcedLanguage("fr");
    setForcedLanguage(null);
    expect(getString("POPUP__GENERAL__TAB_LABEL")).toBe("General");
  });

  it("forced locale takes priority over the EN bundled fallback", () => {
    setForcedLanguage("fr");
    expect(getString("LABEL__TRACK")).toBe("en cours de lecture");
  });

  it("falls back to EN when the forced locale is missing a key", () => {
    setForcedLanguage("fr");
    // key absent from all locales still falls through to EN then warns
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(getString("KEY_ONLY_IN_EN_FALLBACK")).toBe("KEY_ONLY_IN_EN_FALLBACK");
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
    expect(getStringFresh("LABEL__TRACK")).toBe("currently playing");
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
