import { CPL, logger } from "./logger";

interface BrowserApiI18n {
  getMessage: (key: string, substitutions?: any, options?: object) => string;
}

const resolveBrowserApi = (): BrowserApiI18n => {
  const api = (globalThis as any).browser ?? (globalThis as any).chrome;
  return api?.i18n ?? {};
};

const browserI18n = resolveBrowserApi();
const getLocalizedMessage = browserI18n.getMessage?.bind(browserI18n) ?? ((key: string) => key);
export const getString = getLocalizedMessage;

export const logDetectedBrowser = (): void => {
  const chromeApi = (globalThis as any).chrome;
  logger(
    CPL.INFO,
    getString("INFO__BROWSER__DETECTED"),
    chromeApi === undefined || (globalThis as any).browser !== undefined ? "Firefox-based" : "Chromium-based"
  );
};
