import { PLUME_CACHE_KEYS } from "../domain/plume";
import { Action, Store } from "../domain/store";

export interface BrowserApi {
  storage: {
    local: {
      get: (keys: Array<string>) => Promise<any>;
      set: (items: any) => Promise<void>;
    };
  };
}

export interface BrowserState {
  api: BrowserApi;
  cache: BrowserApi["storage"]["local"];
}

export enum BROWSER_ACTIONS {
  SET_CACHE_VALUES = "SET_CACHE_VALUES",
}
export type BrowserAction = Action<BROWSER_ACTIONS.SET_CACHE_VALUES, { keys: PLUME_CACHE_KEYS[]; values: any[] }>;

export interface IBrowserActions {
  setCacheValues: (keys: PLUME_CACHE_KEYS[], values: any[]) => BrowserAction;
}

export interface Browser extends Store<BrowserState, BrowserAction> {}
