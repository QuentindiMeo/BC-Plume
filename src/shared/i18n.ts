import type { PlumeLanguage } from "@/domain/plume";
import { CPL, logger } from "@/shared/logger";
import enMessages from "../../_locales/en/messages.json";
import esMessages from "../../_locales/es/messages.json";
import frMessages from "../../_locales/fr/messages.json";

interface BrowserApiI18n {
  getMessage: (key: string, substitutions?: string | string[]) => string;
}

type EnglishLocaleEntry = {
  message: string;
  placeholders?: Record<string, { content: string; example?: string }>;
};

type LocaleMap = Record<string, EnglishLocaleEntry>;

const browserI18n = ((): BrowserApiI18n | null => {
  const api = (globalThis as any).browser ?? (globalThis as any).chrome;
  return (api?.i18n as BrowserApiI18n | undefined) ?? null;
})();

const LOCALE_MAPS: Record<string, LocaleMap> = {
  en: enMessages as LocaleMap,
  es: esMessages as LocaleMap,
  fr: frMessages as LocaleMap,
};

let forcedLocale: LocaleMap | null = null;

export const setForcedLanguage = (lang: PlumeLanguage | null): void => {
  const chosenLocale = lang !== null ? LOCALE_MAPS[lang] : null;
  forcedLocale = chosenLocale ?? null;
};

const applyEnglishSubstitutions = (entry: EnglishLocaleEntry, substitutions?: string[]): string => {
  let subs: string[];

  if (Array.isArray(substitutions)) {
    subs = substitutions;
  } else {
    subs = [];
  }

  let message = entry.message;

  if (entry.placeholders) {
    for (const [name, { content }] of Object.entries(entry.placeholders)) {
      const resolvedContent = content.replaceAll(/\$(\d+)/g, (_, i: string) => subs[Number(i) - 1] ?? "");
      message = message.replaceAll(new RegExp(String.raw`\$${name}\$`, "gi"), resolvedContent);
    }
  }

  return message;
};

export const getString = (key: string, substitutions?: string[]): string => {
  // Forced locale takes priority over the browser API
  if (forcedLocale) {
    const entry = forcedLocale[key];
    if (entry) return applyEnglishSubstitutions(entry, substitutions);
  }

  if (browserI18n) {
    const result = browserI18n.getMessage(key, substitutions);
    if (result !== "") return result;
  }

  // Fallback to bundled EN messages if browser API is unavailable or doesn't have the key
  const englishLocaleEntry = (enMessages as LocaleMap)[key];
  if (englishLocaleEntry) return applyEnglishSubstitutions(englishLocaleEntry, substitutions);

  console.warn(`[Plume i18n] Key "${key}" not found in any locale`);
  return key;
};

export const logDetectedBrowser = (): void => {
  const chromeApi = (globalThis as any).chrome;
  logger(
    CPL.INFO,
    getString("INFO__BROWSER__DETECTED"),
    chromeApi === undefined || (globalThis as any).browser !== undefined ? "Firefox-based" : "Chromium-based"
  );
};
