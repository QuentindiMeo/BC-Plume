// Verification that all imports resolve correctly
import type { Action, AppState, StateListener, Store } from "../src/store";
import { createStore, loadPersistedState, selectors } from "../src/store";

// This file just tests that imports work - won't be executed
const verifyTypes = () => {
  const store: Store = createStore();
  const state: AppState = store.getState();
  const action: Action = { type: "SET_VOLUME", payload: 0.5 };
  const listener: StateListener<"volume"> = (newVal, oldVal) => {
    console.log(newVal, oldVal);
  };

  console.log("All imports verified:", {
    store,
    state,
    action,
    listener,
    selectors,
    loadPersistedState,
  });
};

export { verifyTypes };
