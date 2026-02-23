import { PlumeCacheKey } from "../domain/browser";
import { IAction, IStore } from "../domain/store";

export interface IBrowserApi {
  storage: {
    local: {
      get: (keys: Array<string>) => Promise<any>;
      set: (items: any) => Promise<void>;
    };
  };
}
export type IBrowserCache = IBrowserApi["storage"]["local"];

export interface IBrowserState {
  api: IBrowserApi;
  cache: IBrowserCache;
}

export enum BROWSER_ACTIONS {
  SET_CACHE_VALUES = "SET_CACHE_VALUES",
}
export type BrowserAction = IAction<BROWSER_ACTIONS.SET_CACHE_VALUES, { keys: PlumeCacheKey[]; values: any[] }>;

interface IBrowserActions {
  setCacheValues: (keys: PlumeCacheKey[], values: any[]) => BrowserAction;
}
export const browserActions: IBrowserActions = {
  setCacheValues: (keys: PlumeCacheKey[], values: any[]): BrowserAction => ({
    type: BROWSER_ACTIONS.SET_CACHE_VALUES,
    payload: { keys, values },
  }),
} as const;

export interface IBrowser extends IStore<IBrowserState, BrowserAction> {}
