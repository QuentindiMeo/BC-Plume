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

  if (firefoxApi !== undefined && firefoxApi?.storage)
    return firefoxApi;
  else
    return chromeApi;
}
