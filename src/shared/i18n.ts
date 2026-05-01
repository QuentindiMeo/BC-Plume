import type { PlumeLanguage } from "@/domain/plume";
import enMessages from "../../_locales/en/messages.json";
import esMessages from "../../_locales/es/messages.json";
import frMessages from "../../_locales/fr/messages.json";
import itMessages from "../../_locales/it/messages.json";
import ptBrMessages from "../../_locales/pt_BR/messages.json";
import roMessages from "../../_locales/ro/messages.json";
import ruMessages from "../../_locales/ru/messages.json";

interface BrowserApiI18n {
  getMessage: (key: string, substitutions?: string | string[]) => string;
}

type LocaleEntry = {
  message: string;
  placeholders?: Record<string, { content: string; example?: string }>;
};

type LocaleMap = Record<string, LocaleEntry>;

const browserI18n = ((): BrowserApiI18n | null => {
  const api = (globalThis as any).browser ?? (globalThis as any).chrome;
  return (api?.i18n as BrowserApiI18n | undefined) ?? null;
})();

const LOCALE_MAPS: Record<string, LocaleMap> = {
  en: enMessages as LocaleMap,
  es: esMessages as LocaleMap,
  fr: frMessages as LocaleMap,
  it: itMessages as LocaleMap,
  pt_BR: ptBrMessages as LocaleMap,
  ro: roMessages as LocaleMap,
  ru: ruMessages as LocaleMap,
};

let forcedLocale: LocaleMap | null = null;

export const setForcedLanguage = (lang: PlumeLanguage | null): void => {
  const chosenLocale = lang !== null ? LOCALE_MAPS[lang] : null;
  forcedLocale = chosenLocale ?? null;
};

const applyEnglishSubstitution = (entry: LocaleEntry, substitutions?: string[]): string => {
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

export const getActiveLocale = (): string => {
  if (forcedLocale) {
    for (const [code, map] of Object.entries(LOCALE_MAPS)) {
      if (map === forcedLocale) return code;
    }
  }
  const api = (globalThis as any).browser ?? (globalThis as any).chrome;
  const rawLang = api?.i18n?.getUILanguage?.() as string | undefined;
  const normalizedTag = rawLang?.replace("-", "_");
  if (normalizedTag && normalizedTag in LOCALE_MAPS) return normalizedTag;
  const baseLang = rawLang?.split("-")[0];
  return baseLang && baseLang in LOCALE_MAPS ? baseLang : "en";
};

export const getString = (key: string, substitutions?: string[]): string => {
  // Forced locale takes priority over the browser API
  if (forcedLocale) {
    const entry = forcedLocale[key];
    if (entry) return applyEnglishSubstitution(entry, substitutions);
  }

  if (browserI18n) {
    const result = browserI18n.getMessage(key, substitutions);
    if (result !== "") return result;
  }

  // Fallback to bundled EN messages if browser API is unavailable or doesn't have the key
  const englishLocaleEntry = (enMessages as LocaleMap)[key];
  if (englishLocaleEntry) return applyEnglishSubstitution(englishLocaleEntry, substitutions);

  console.warn(`[Plume i18n] Key "${key}" not found in any locale`);
  return key;
};
