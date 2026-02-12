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

function getBrowserAPI(): BrowserAPI {
  if (!(globalThis as any).browser && !(globalThis as any).chrome)
    throw new Error(
      "No compatible browser API found. This extension requires a Chromium-based or Firefox-based browser."
    );

  return (globalThis as any).browser ?? (globalThis as any).chrome;
}

let cachedBrowserApi: BrowserAPI | null = null;
export function getBrowserApi(): BrowserAPI {
  if (cachedBrowserApi) return cachedBrowserApi;

  cachedBrowserApi = getBrowserAPI();
  return cachedBrowserApi;
}
export const browserApi: BrowserAPI = new Proxy({} as BrowserAPI, {
  get(_target, prop, _receiver) {
    const api = getBrowserApi() as any;
    const value = api[prop];
    return typeof value === "function" ? value.bind(api) : value;
  },
});
export const browserCache = new Proxy({} as BrowserAPI["storage"]["local"], {
  get(_target, prop, _receiver) {
    const cache = getBrowserApi().storage.local as any;
    const value = cache[prop];
    return typeof value === "function" ? value.bind(cache) : value;
  },
});
