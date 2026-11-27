import { afterEach, describe, expect, it } from "vitest";

import { PLUME_SUPPORTED_LANGUAGES, PlumeLanguage } from "@/domain/plume";
import { getActiveLangTag, setForcedLanguage } from "@/shared/i18n";

describe("getActiveLangTag / lang attribute validity", () => {
  afterEach(() => {
    setForcedLanguage("auto");
  });

  it.each(PLUME_SUPPORTED_LANGUAGES.filter((code) => code !== "auto"))(
    "'%s' produces a valid BCP-47 lang tag",
    (code: PlumeLanguage) => {
      setForcedLanguage(code);
      const langTag = getActiveLangTag();
      expect(() => Intl.getCanonicalLocales(langTag)).not.toThrow();
    }
  );

  it("normalizes the underscore region subtag used by _locales directory names", () => {
    setForcedLanguage("pt_BR");
    expect(getActiveLangTag()).toBe("pt-BR");
  });
});
