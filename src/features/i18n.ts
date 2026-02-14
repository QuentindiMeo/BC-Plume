import { getBrowserInstance } from "../infra/BrowserImpl";
import { CPL, logger } from "./logger";

export const logDetectedBrowser = (): void => {
  const chromeApi = (globalThis as any).chrome;
  logger(
    CPL.INFO,
    getString("INFO__BROWSER__DETECTED"),
    chromeApi === undefined || (globalThis as any).browser !== undefined ? "Firefox-based" : "Chromium-based"
  );
};

const browserApi = getBrowserInstance().getState().api;
const getLocalizedMessage = browserApi.i18n?.getMessage?.bind(browserApi.i18n) ?? ((key: string) => key);

export const getString = getLocalizedMessage;
