import { PlumeCacheKey } from "../../domain/browser";
import { BrowserAction, IBrowser, IBrowserApi, IBrowserCache, IBrowserState } from "../../infra/Browser";
import { meta, PROCESS_ENV } from "../../infra/node";
import { CPL, logger } from "../../shared/logger";

const assertBrowserApi = (): IBrowserApi => {
  if (!(globalThis as any).browser && !(globalThis as any).chrome)
    throw new Error(
      "No compatible browser API found. This extension requires a Chromium-based or Firefox-based browser."
    );

  return (globalThis as any).browser ?? (globalThis as any).chrome;
};

let unifiedBrowserApi: IBrowserApi | null = null;
const getBrowserApi = (): IBrowserApi => {
  unifiedBrowserApi ??= assertBrowserApi();
  return unifiedBrowserApi;
};
const browserApi: IBrowserApi = new Proxy({} as IBrowserApi, {
  get(_target, prop, _receiver) {
    const api = getBrowserApi() as any;
    const value = api[prop];
    return typeof value === "function" ? value.bind(api) : value;
  },
});
const browserCache = new Proxy({} as IBrowserCache, {
  get(_target, prop, _receiver) {
    const cache = getBrowserApi().storage.local as any;
    const value = cache[prop];
    return typeof value === "function" ? value.bind(cache) : value;
  },
});

const INITIAL_STATE: IBrowserState = {
  api: browserApi,
  cache: browserCache,
};

const createBrowserInstance = (): IBrowser => {
  let state: IBrowserState = { ...INITIAL_STATE };

  const updateState = (keys: PlumeCacheKey[], values: any[]): void => {
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

  // Development-only action logger
  const logStateChange = (action: BrowserAction): void => {
    if (meta.env !== PROCESS_ENV.PRODUCTION) {
      const hasPayload = "payload" in action;
      logger(CPL.DEBUG, `[STORE] ${action.type}${hasPayload ? ` → ${JSON.stringify(action.payload)}` : ""}`);
    }
  };

  const reducer = (action: BrowserAction): void => {
    updateState(action.payload.keys, action.payload.values);
  };

  return {
    getState(): Readonly<IBrowserState> {
      return state;
    },

    dispatch(action: BrowserAction): void {
      reducer(action);
      logStateChange(action);
    },
  };
};

let browserInstance: IBrowser | null = null;
export const getBrowserInstance = (): IBrowser => {
  browserInstance ??= createBrowserInstance();
  return browserInstance;
};
