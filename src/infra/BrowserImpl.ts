import { process } from "../domain/node";
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

enum BROWSER_ACTIONS {
  SET_CACHE_VALUES = "SET_CACHE_VALUES",
}
export type BrowserAction = Action<BROWSER_ACTIONS.SET_CACHE_VALUES, { keys: PLUME_CACHE_KEYS[]; values: any[] }>;

export const browserActions = {
  setCacheValues: (keys: PLUME_CACHE_KEYS[], values: any[]): BrowserAction => ({
    type: BROWSER_ACTIONS.SET_CACHE_VALUES,
    payload: { keys, values },
  }),
} as const;

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

  /**
   * Development-only state change logger for debugging.
   * Logs all dispatched actions and resulting state changes.
   */
  const logStateChange = (action: BrowserAction, prevState: BrowserState, nextState: BrowserState): void => {
    // Only log in development builds
    if (process.env.NODE_ENV !== "production") {
      const hasPayload = "payload" in action;

      logger(CPL.DEBUG, `[STORE] ${action.type}${hasPayload ? ` → ${JSON.stringify(action.payload)}` : ""}`);

      // Find what changed
      const nextStateKeys = Object.keys(nextState) as Array<keyof BrowserState>;
      const changes: Array<{ key: string; from: any; to: any }> = [];
      for (const key of nextStateKeys) {
        if (prevState[key] !== nextState[key]) {
          changes.push({
            key,
            from: prevState[key],
            to: nextState[key],
          });
        }
      }

      if (changes.length > 0) logger(CPL.DEBUG, "[STORE] State changes: " + JSON.stringify(changes));
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
      const prevState = { ...state };
      reducer(action);
      logStateChange(action, prevState, state);
    },
  };
};

export const getBrowserInstance = (): BrowserInstance => {
  browserInstance ??= createBrowserInstance();
  return browserInstance;
};
