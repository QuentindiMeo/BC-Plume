import { getBrowserAPI } from "./browser";

const browserApi = getBrowserAPI();

if (!browserApi.i18n?.getMessage) {
  browserApi.i18n = {
    getMessage: (key: string) => key,
  };
}

export const getString = browserApi.i18n.getMessage;
