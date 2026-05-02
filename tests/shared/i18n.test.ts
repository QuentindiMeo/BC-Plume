import { afterEach, describe, expect, it, vi } from "vitest";

import { getActiveLocale, getString, setForcedLanguage } from "@/shared/i18n";

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

  it("forced locale takes priority over the bundled fallback", () => {
    setForcedLanguage("fr");
    expect(getString("LABEL__TRACK")).toBe("en cours de lecture");
  });

  it("prints key when it's missing from both the forced locale and the fallback", () => {
    setForcedLanguage("fr");
    // key absent from all locales still falls through to fallback then warns
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(getString("KEY_NOT_PRESENT_IN_FR_LOCALE")).toBe("KEY_NOT_PRESENT_IN_FR_LOCALE");
    warnSpy.mockRestore();
  });
});

describe("getActiveLocale", () => {
  afterEach(() => {
    setForcedLanguage("auto");
  });

  it("returns 'en' by default when no forced locale and no browser API", () => {
    expect(getActiveLocale()).toBe("en");
  });

  it("returns 'fr' when FR is forced", () => {
    setForcedLanguage("fr");
    expect(getActiveLocale()).toBe("fr");
  });

  it("returns 'es' when ES is forced", () => {
    setForcedLanguage("es");
    expect(getActiveLocale()).toBe("es");
  });

  it("returns 'en' when EN is forced", () => {
    setForcedLanguage("en");
    expect(getActiveLocale()).toBe("en");
  });

  it("returns 'en' after resetting forced locale to auto", () => {
    setForcedLanguage("fr");
    setForcedLanguage("auto");
    expect(getActiveLocale()).toBe("en");
  });

  it("returns 'en' after resetting forced locale to null", () => {
    setForcedLanguage("fr");
    setForcedLanguage(null);
    expect(getActiveLocale()).toBe("en");
  });
});

describe("getActiveLocale (browser i18n live path)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("returns the chrome UI language when available", async () => {
    vi.stubGlobal("chrome", { i18n: { getMessage: () => "", getUILanguage: () => "fr-FR" } });
    vi.resetModules();
    const { getActiveLocale: fresh } = await import("@/shared/i18n");
    expect(fresh()).toBe("fr");
  });

  it("returns the Firefox browser UI language when available", async () => {
    vi.stubGlobal("browser", { i18n: { getMessage: () => "", getUILanguage: () => "es" } });
    vi.resetModules();
    const { getActiveLocale: fresh } = await import("@/shared/i18n");
    expect(fresh()).toBe("es");
  });

  it("returns base language code stripped of region subtag", async () => {
    vi.stubGlobal("chrome", { i18n: { getMessage: () => "", getUILanguage: () => "es-MX" } });
    vi.resetModules();
    const { getActiveLocale: fresh } = await import("@/shared/i18n");
    expect(fresh()).toBe("es");
  });

  it("returns 'pt_BR' when browser UI language is pt-BR (hyphen normalized to underscore)", async () => {
    vi.stubGlobal("chrome", { i18n: { getMessage: () => "", getUILanguage: () => "pt-BR" } });
    vi.resetModules();
    const { getActiveLocale: fresh } = await import("@/shared/i18n");
    expect(fresh()).toBe("pt_BR");
  });

  it("falls back to 'en' for unsupported browser locale", async () => {
    vi.stubGlobal("chrome", { i18n: { getMessage: () => "", getUILanguage: () => "de-DE" } });
    vi.resetModules();
    const { getActiveLocale: fresh } = await import("@/shared/i18n");
    expect(fresh()).toBe("en");
  });

  it("forced locale takes priority over browser UI language", async () => {
    vi.stubGlobal("chrome", { i18n: { getMessage: () => "", getUILanguage: () => "es" } });
    vi.resetModules();
    const { getActiveLocale: fresh, setForcedLanguage: setForced } = await import("@/shared/i18n");
    setForced("fr");
    expect(fresh()).toBe("fr");
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
