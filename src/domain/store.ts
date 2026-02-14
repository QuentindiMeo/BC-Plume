import { NoArgFunction } from "../shared/types";

export const handleUnknownAction = (action: never): never => {
  throw new Error(`Unhandled action type: ${JSON.stringify(action)} — implementation missing for this action.`);
};

export type Action<T = string, P = undefined> = P extends undefined ? { type: T } : { type: T; payload: P };

export type Listener<T, K extends keyof T> = (value: T[K], prevValue: T[K]) => void;

export interface Store<T, A extends Action = Action> {
  getState(): Readonly<T>;
  dispatch(action: A): void;
  subscribe?<K extends keyof T>(key: K, listener: Listener<T, K>): NoArgFunction;
  subscribeAll?(listener: (state: T) => void): NoArgFunction;
}
