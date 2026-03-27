import { NoArgFunction } from "@/shared/types";

export type IAction<ActionId = string, Payload = undefined> = Payload extends undefined
  ? { type: ActionId }
  : { type: ActionId; payload: Payload };
export type Thunk<Store, Action> = (
  dispatch: (action: Action | Thunk<Store, Action>) => void,
  getState: () => Readonly<Store>
) => Promise<void>;

export type IListener<State, Key extends keyof State> = (value: State[Key], prevValue: State[Key]) => void;

export interface IStore<State, Action> {
  getState(): Readonly<State>;
  dispatch(action: Action | Thunk<State, Action>): void;
  subscribe?<Key extends keyof State>(key: Key, listener: IListener<State, Key>): NoArgFunction;
  subscribeAll?(listener: (state: State) => void): NoArgFunction;
}

export interface IScenarioEntry<State, Action> {
  action: Action;
  stateAfter: Readonly<State>;
  timestamp: number;
}

export interface IScenarioView<State, Action> {
  readonly entries: ReadonlyArray<IScenarioEntry<State, Action>>;

  /** Index of the *current* position in the scenario timeline (points to the last applied entry, -1 when at initial state). */
  readonly cursor: number;
}

/** Controls exposed by the scenario recorder. */
export interface IScenarioControls<State, Action> {
  /** Record a new entry. Clears any redo-able future beyond the current cursor. */
  record(action: Action, stateAfter: Readonly<State>): void;

  /** Move one step back, returning the state to restore (or `null` if already at the beginning). */
  undo(initialState: Readonly<State>): Readonly<State> | null;

  /** Move one step forward, returning the state to restore (or `null` if already at the end). */
  redo(): Readonly<State> | null;

  /** Replay the scenario from the beginning up to `toIndex` (inclusive), returning the final state. Falls back to `initialState` when `toIndex` is -1. */
  replayScenario(initialState: Readonly<State>, toIndex?: number): Readonly<State>;

  /** Get a read-only view of the scenario. */
  getScenarioView(): IScenarioView<State, Action>;

  /** Clear all recorded entries and reset the cursor. */
  clearScenario(): void;
}

const DEFAULT_MAX_SCENARIO_ENTRIES = 200;

/**
 * Creates a scenario recorder that tracks dispatched actions and resulting state snapshots, enabling undo, redo, and full scenario replay for time-travel debugging.
 * Should be used in testing environment only due to memory overhead of storing state snapshots.
 */
export const createScenarioRecorder = <State, Action>(
  maxEntries: number = DEFAULT_MAX_SCENARIO_ENTRIES
): IScenarioControls<State, Action> => {
  let entries: Array<IScenarioEntry<State, Action>> = [];
  let cursor = -1; // Points to the last *applied* entry. -1 means we're at the initial state (before any action).

  const record = (action: Action, stateAfter: Readonly<State>): void => {
    // Discard any future entries beyond cursor (branching off)
    if (cursor < entries.length - 1) {
      entries = entries.slice(0, cursor + 1);
    }

    entries.push({ action, stateAfter: { ...stateAfter }, timestamp: Date.now() });

    // Enforce capacity limit (drop oldest entries)
    if (entries.length > maxEntries) {
      const overflow = entries.length - maxEntries;
      entries = entries.slice(overflow);
    }
    cursor = entries.length - 1;
  };

  const undo = (initialState: Readonly<State>): Readonly<State> | null => {
    if (cursor < 0) return null; // already at initial state

    cursor--;
    return cursor >= 0 ? { ...entries[cursor].stateAfter } : { ...initialState };
  };

  const redo = (): Readonly<State> | null => {
    if (cursor >= entries.length - 1) return null;

    cursor++;
    return { ...entries[cursor].stateAfter };
  };

  const replayScenario = (initialState: Readonly<State>, toIndex?: number): Readonly<State> => {
    const target = toIndex ?? entries.length - 1;
    if (target < 0 || entries.length === 0) {
      cursor = -1;
      return { ...initialState };
    }

    const clampedTarget = Math.min(target, entries.length - 1);
    cursor = clampedTarget;
    return { ...entries[clampedTarget].stateAfter };
  };

  const getScenarioView = (): IScenarioView<State, Action> => ({
    entries,
    cursor,
  });

  const clearScenario = (): void => {
    entries = [];
    cursor = -1;
  };

  return { record, undo, redo, replayScenario, getScenarioView, clearScenario };
};
