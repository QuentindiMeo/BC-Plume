import { PLUME_CACHE_KEYS } from "../domain/plume";
import { Action, Store } from "../domain/store";
import { getString } from "../features/i18n";
import { CPL, logger } from "../features/logger";

interface BrowserAPI {
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

const assertBrowserApi = (): BrowserAPI => {
  if (!(globalThis as any).browser && !(globalThis as any).chrome)
    throw new Error(
      "No compatible browser API found. This extension requires a Chromium-based or Firefox-based browser."
    );

  return (globalThis as any).browser ?? (globalThis as any).chrome;
};

let unifiedBrowserApi: BrowserAPI | null = null;
const getBrowserApi = (): BrowserAPI => {
  unifiedBrowserApi ??= assertBrowserApi();
  return unifiedBrowserApi;
};
const browserApi: BrowserAPI = new Proxy({} as BrowserAPI, {
  get(_target, prop, _receiver) {
    const api = getBrowserApi() as any;
    const value = api[prop];
    return typeof value === "function" ? value.bind(api) : value;
  },
});
const browserCache = new Proxy({} as BrowserAPI["storage"]["local"], {
  get(_target, prop, _receiver) {
    const cache = getBrowserApi().storage.local as any;
    const value = cache[prop];
    return typeof value === "function" ? value.bind(cache) : value;
  },
});

interface BrowserState {
  api: BrowserAPI;
  cache: BrowserAPI["storage"]["local"];
}

export enum BROWSER_ACTION_TYPES {
  SET_CACHE_VALUE = "SET_CACHE_VALUE",
}
export type BrowserAction = Action<"SET_CACHE_VALUE", { key: PLUME_CACHE_KEYS; value: any }>;

interface BrowserInstance extends Store<BrowserState, BrowserAction> {}

const INITIAL_STATE: BrowserState = {
  api: browserApi,
  cache: browserCache,
};

let browserInstance: BrowserInstance | null = null;

const createBrowserInstance = (): BrowserInstance => {
  let state: BrowserState = { ...INITIAL_STATE };

  const updateState = <K extends keyof BrowserState>(key: PLUME_CACHE_KEYS, value: BrowserState[K]): void => {
    state.cache
      .set({ [key]: value })
      .then(() => {
        logger(CPL.DEBUG, getString("DEBUG__STATE__PERSISTED"), { key, value });
      })
      .catch((error) => {
        logger(CPL.ERROR, getString("ERROR__STATE__PERSIST_FAILED"), error);
      });
  };

  const reducer = (action: BrowserAction): void => {
    updateState(action.payload.key, action.payload.value);
  };

  return {
    getState(): Readonly<BrowserState> {
      return state;
    },
    dispatch(action: BrowserAction): void {
      reducer(action);
    },
    subscribe() {
      throw new Error("BrowserInstance does not support subscribing to state changes.");
    },
    subscribeAll() {
      throw new Error("BrowserInstance does not support subscribing to state changes.");
    },
  };
};

export const getBrowserInstance = (): BrowserInstance => {
  browserInstance ??= createBrowserInstance();
  return browserInstance;
};
