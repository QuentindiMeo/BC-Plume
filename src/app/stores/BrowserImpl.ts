import { PLUME_CACHE_KEYS } from "../../domain/plume";
import {
  Browser,
  BROWSER_ACTIONS,
  BrowserAction,
  BrowserApi,
  BrowserState,
  IBrowserActions,
} from "../../infra/Browser";
import { meta, PROCESS_ENV } from "../../infra/node";
import { CPL, logger } from "../../shared/logger";

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

export const browserActions: IBrowserActions = {
  setCacheValues: (keys: PLUME_CACHE_KEYS[], values: any[]): BrowserAction => ({
    type: BROWSER_ACTIONS.SET_CACHE_VALUES,
    payload: { keys, values },
  }),
} as const;

const INITIAL_STATE: BrowserState = {
  api: browserApi,
  cache: browserCache,
};

let browserInstance: Browser | null = null;

const createBrowserInstance = (): Browser => {
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
    getState(): Readonly<BrowserState> {
      return state;
    },

    dispatch(action: BrowserAction): void {
      reducer(action);
      logStateChange(action);
    },
  };
};

export const getBrowserInstance = (): Browser => {
  browserInstance ??= createBrowserInstance();
  return browserInstance;
};
