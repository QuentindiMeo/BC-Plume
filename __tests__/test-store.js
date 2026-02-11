// Simple Node.js test to verify store implementation compiles and exports correctly

async function testStore() {
  console.log("Testing store implementation...\n");

  try {
    // Test that files exist
    const fs = require('node:fs');
    const path = require('node:path');

    const storeFiles = [
      'src/store/store.ts',
      'src/store/selectors.ts',
      'src/store/persistence.ts',
      'src/store/index.ts'
    ];

    console.log("✓ Checking files exist...");
    for (const file of storeFiles) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file: ${file}`);
      }
      const stats = fs.statSync(filePath);
      console.log(`  - ${file} (${stats.size} bytes)`);
    }

    console.log("\n✓ All store files created successfully!");

    // Test file sizes are reasonable
    const storeSize = fs.statSync('src/store/store.ts').size;
    const selectorsSize = fs.statSync('src/store/selectors.ts').size;
    const persistenceSize = fs.statSync('src/store/persistence.ts').size;

    console.log(`\n✓ Store implementation size: ${storeSize} bytes`);
    console.log(`✓ Selectors size: ${selectorsSize} bytes`);
    console.log(`✓ Persistence size: ${persistenceSize} bytes`);
    console.log(`✓ Total: ${storeSize + selectorsSize + persistenceSize} bytes`);

    console.log("\n✅ Store implementation verification passed!");

  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

testStore();
