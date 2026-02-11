#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");


// Read version from package.json (single source of truth)
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
const packageVersion = packageJson.version;

console.log(`🔄 Synchronizing version across manifest files: ${packageVersion}`);

// Update root manifest.json
const rootManifestPath = path.join(__dirname, "..", "manifest.json");
if (fs.existsSync(rootManifestPath)) {
  const rootManifest = JSON.parse(fs.readFileSync(rootManifestPath, "utf8"));
  if (rootManifest.version === packageVersion) {
    console.log("✓ Root manifest.json already up to date");
  } else {
    rootManifest.version = packageVersion;
    fs.writeFileSync(rootManifestPath, JSON.stringify(rootManifest, null, 2) + "\n");
    console.log(`✅ Updated root manifest.json: ${packageVersion}`);
  }
}

const chromeManifestPath = path.join(__dirname, "..", "build", "chrome", "manifest.json");
if (fs.existsSync(chromeManifestPath)) {
  const chromeManifest = JSON.parse(fs.readFileSync(chromeManifestPath, "utf8"));
  if (chromeManifest.version === packageVersion) {
    console.log("✓ Chrome manifest already up to date");
  } else {
    chromeManifest.version = packageVersion;
    fs.writeFileSync(chromeManifestPath, JSON.stringify(chromeManifest, null, 2) + "\n");
    console.log(`✅ Updated build/chrome/manifest.json: ${packageVersion}`);
  }
}

// Update Firefox build manifest if it exists
const firefoxManifestPath = path.join(__dirname, "..", "build", "firefox", "manifest.json");
if (fs.existsSync(firefoxManifestPath)) {
  const firefoxManifest = JSON.parse(fs.readFileSync(firefoxManifestPath, "utf8"));
  if (firefoxManifest.version === packageVersion) {
    console.log("✓ Firefox manifest already up to date");
  } else {
    firefoxManifest.version = packageVersion;
    fs.writeFileSync(firefoxManifestPath, JSON.stringify(firefoxManifest, null, 2) + "\n");
    console.log(`✅ Updated build/firefox/manifest.json: ${packageVersion}`);
  }
}

console.log("✅ Version synchronization complete!");
