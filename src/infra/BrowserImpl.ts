import { PLUME_CACHE_KEYS } from "../domain/plume";
import { Action, Store } from "../domain/store";
import { CPL, logger } from "../features/logger";

interface BrowserApi {
  storage: {
    local: {
      get: (keys: Array<string>) => Promise<any>;
      set: (items: any) => Promise<void>;
    };
  };
}

const assertBrowserApi = (): BrowserApi => {
  if (!(globalThis as any).browser && !(globalThis as any).chrome)
    throw new Error(
      "No compatible browser API found. This extension requires a Chromium-based or Firefox-based browser."
    );

  return (globalThis as any).browser ?? (globalThis as any).chrome;
};

let unifiedBrowserApi: BrowserApi | null = null;
const getBrowserApi = (): BrowserApi => {
  unifiedBrowserApi ??= assertBrowserApi();
  return unifiedBrowserApi;
};
const browserApi: BrowserApi = new Proxy({} as BrowserApi, {
  get(_target, prop, _receiver) {
    const api = getBrowserApi() as any;
    const value = api[prop];
    return typeof value === "function" ? value.bind(api) : value;
  },
});
const browserCache = new Proxy({} as BrowserApi["storage"]["local"], {
  get(_target, prop, _receiver) {
    const cache = getBrowserApi().storage.local as any;
    const value = cache[prop];
    return typeof value === "function" ? value.bind(cache) : value;
  },
});

interface BrowserState {
  api: BrowserApi;
  cache: BrowserApi["storage"]["local"];
}

export enum BROWSER_ACTIONS {
  SET_CACHE_VALUES = "SET_CACHE_VALUES",
}
export type BrowserAction = Action<BROWSER_ACTIONS.SET_CACHE_VALUES, { keys: PLUME_CACHE_KEYS[]; values: any[] }>;

interface BrowserInstance extends Store<BrowserState, BrowserAction> {}

const INITIAL_STATE: BrowserState = {
  api: browserApi,
  cache: browserCache,
};

let browserInstance: BrowserInstance | null = null;

const createBrowserInstance = (): BrowserInstance => {
  let state: BrowserState = { ...INITIAL_STATE };

  const updateState = (keys: PLUME_CACHE_KEYS[], values: any[]): void => {
    const toSet: any = {};
    keys.forEach((key, index) => {
      toSet[key] = values[index];
    });

    state.cache
      .set(toSet)
      .then(() => {
        logger(CPL.DEBUG, "State persisted", { keys, values });
      })
      .catch((error) => {
        logger(CPL.ERROR, "Failed to persist state", error);
      });
  };

  const reducer = (action: BrowserAction): void => {
    updateState(action.payload.keys, action.payload.values);
  };

  return {
    getState(): Readonly<BrowserState> {
      return state;
    },
    dispatch(action: BrowserAction): void {
      reducer(action);
    },
  };
};

export const getBrowserInstance = (): BrowserInstance => {
  browserInstance ??= createBrowserInstance();
  return browserInstance;
};
