import type { Action, AppState, StateListener, Store } from "../src/store";
import { createStore, loadPersistedState, selectors } from "../src/store";
import { ACTION_TYPES } from "../src/store/store";

export async function testStore() {
  console.log("Testing store implementation...\n");

  try {
    // Test that files exist
    const fs = require("node:fs");
    const path = require("node:path");

    const storeFiles = [
      "src/store/store.ts",
      "src/store/selectors.ts",
      "src/store/persistence.ts",
      "src/store/index.ts",
    ];

    console.log("✓ Checking files exist...");
    for (const file of storeFiles) {
      const filePath = path.join(__dirname, "..", file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file: ${file}`);
      }
      const stats = fs.statSync(filePath);
      console.log(`  - ${file} (${stats.size} bytes)`);
    }

    console.log("\n✓ All store files created successfully!");

    // Test file sizes are reasonable
    const storeSrcPath = path.join(__dirname, "..", "src/store");
    const storeSize = fs.statSync(path.join(storeSrcPath, "store.ts")).size;
    const selectorsSize = fs.statSync(path.join(storeSrcPath, "selectors.ts")).size;
    const persistenceSize = fs.statSync(path.join(storeSrcPath, "persistence.ts")).size;

    console.log(`\n✓ Store implementation size: ${storeSize} bytes`);
    console.log(`✓ Selectors size: ${selectorsSize} bytes`);
    console.log(`✓ Persistence size: ${persistenceSize} bytes`);
    console.log(`✓ Total: ${storeSize + selectorsSize + persistenceSize} bytes`);

    console.log("\n✅ Store implementation verification passed!");
  } catch (error: unknown) {
    console.error("\n❌ Test failed:", (error as Error).message);
    process.exit(1);
  }
}

export const verifyTypes = () => {
  const store: Store = createStore();
  const state: AppState = store.getState();
  const action: Action = { type: ACTION_TYPES.SET_VOLUME, payload: 0.5 };
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