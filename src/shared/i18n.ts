import enMessages from "../../_locales/en/messages.json";
import { CPL, logger } from "./logger";

interface BrowserApiI18n {
  getMessage: (key: string, substitutions?: string | string[]) => string;
}

const browserI18n = ((): BrowserApiI18n | null => {
  const api = (globalThis as any).browser ?? (globalThis as any).chrome;
  return (api?.i18n as BrowserApiI18n | undefined) ?? null;
})();

type EnglishLocaleEntry = {
  message: string;
  placeholders?: Record<string, { content: string; example?: string }>;
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
  if (browserI18n) {
    const result = browserI18n.getMessage(key, substitutions);
    if (result !== "") return result;
  }

  // Fallback to bundled EN messages if browser API is unavailable or doesn't have the key
  const englishLocaleEntry = (enMessages as Record<string, EnglishLocaleEntry>)[key];
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
