import { NoArgFunction } from "../shared/types";

export const handleUnknownAction = (action: never): never => {
  throw new Error(`Unhandled action type: ${JSON.stringify(action)} — implementation missing for this action.`);
};

export type Action<ActionId = string, Payload = undefined> = Payload extends undefined
  ? { type: ActionId }
  : { type: ActionId; payload: Payload };

export type Listener<State, Key extends keyof State> = (value: State[Key], prevValue: State[Key]) => void;

export type Thunk = (dispatch: Store<any, any>["dispatch"], getState: () => Readonly<object>) => Promise<void>;

export interface Store<State, Action> {
  getState(): Readonly<State>;
  dispatch(action: Action | Thunk): void;
  subscribe?<Key extends keyof State>(key: Key, listener: Listener<State, Key>): NoArgFunction;
  subscribeAll?(listener: (state: State) => void): NoArgFunction;
}
