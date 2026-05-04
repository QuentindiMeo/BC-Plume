import { IBrowserApi } from "@/domain/ports/browser";
import { BrowserApiError } from "@/shared/errors";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

export const isSafariBrowser = (): boolean => /^Apple/.test(navigator.vendor);

export const logDetectedBrowser = (): void => {
  const chromeApi = (globalThis as any).chrome;
  logger(
    CPL.INFO,
    getString("INFO__BROWSER__DETECTED"),
    chromeApi === undefined || (globalThis as any).browser !== undefined ? "Firefox-based" : "Chromium-based"
  );
};

export const inferBrowserApi = (): IBrowserApi => {
  if (!(globalThis as any).browser && !(globalThis as any).chrome) throw new BrowserApiError();

  return (globalThis as any).browser ?? (globalThis as any).chrome;
};
