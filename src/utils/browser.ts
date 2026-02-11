import { getString } from "./i18n";
import { CPL, logger } from "./logger";

export interface BrowserAPI {
  storage: {
    local: {
      get: (keys: Array<string>) => Promise<any>;
      set: (items: any) => Promise<void>;
    };
  };
  i18n: {
    getMessage: (key: string, substitutions?: any, options?: object) => string;
  };
}

export function getBrowserAPI(): BrowserAPI {
  const chromeApi = (globalThis as any).chrome;
  const firefoxApi = (globalThis as any).browser;

  if (firefoxApi !== undefined && firefoxApi?.storage) return firefoxApi;
  else return chromeApi;
}

const browserApi = getBrowserAPI();
export const browserCache = browserApi.storage.local;
const chromeApi = (globalThis as any).chrome;
logger(
  CPL.INFO,
  getString("INFO__BROWSER__DETECTED"),
  chromeApi === undefined || (globalThis as any).browser !== undefined ? "Firefox-based" : "Chromium-based"
);
