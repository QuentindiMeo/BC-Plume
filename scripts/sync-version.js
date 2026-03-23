#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");


// ! Read version from package.json (single source of truth)
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
const packageVersion = packageJson.version;

console.log(`🔄 Synchronizing version across manifest files: ${packageVersion}`);

// Update root manifest.json
const rootManifestPath = path.join(__dirname, "..", "manifest.json");
if (fs.existsSync(rootManifestPath)) {
  const rootManifest = JSON.parse(fs.readFileSync(rootManifestPath, "utf8"));
  if (rootManifest.version !== packageVersion) {
    rootManifest.version = packageVersion;
    fs.writeFileSync(rootManifestPath, JSON.stringify(rootManifest, null, 2) + "\n");
    console.log(`✅ Updated root manifest.json: ${packageVersion}`);
  }
}

const chromeManifestPath = path.join(__dirname, "..", "build", "chrome", "manifest.json");
if (fs.existsSync(chromeManifestPath)) {
  const chromeManifest = JSON.parse(fs.readFileSync(chromeManifestPath, "utf8"));
  if (chromeManifest.version !== packageVersion) {
    chromeManifest.version = packageVersion;
    fs.writeFileSync(chromeManifestPath, JSON.stringify(chromeManifest, null, 2) + "\n");
    console.log(`✅ Updated build/chrome/manifest.json: ${packageVersion}`);
  }
}

// Update Firefox build manifest if it exists
const firefoxManifestPath = path.join(__dirname, "..", "build", "firefox", "manifest.json");
if (fs.existsSync(firefoxManifestPath)) {
  const firefoxManifest = JSON.parse(fs.readFileSync(firefoxManifestPath, "utf8"));
  if (firefoxManifest.version !== packageVersion) {
    firefoxManifest.version = packageVersion;
    fs.writeFileSync(firefoxManifestPath, JSON.stringify(firefoxManifest, null, 2) + "\n");
    console.log(`✅ Updated build/firefox/manifest.json: ${packageVersion}`);
  }
}

const readmePath = path.join(__dirname, "..", "README.md");
if (fs.existsSync(readmePath)) {
  let readmeContent = fs.readFileSync(readmePath, "utf8");
  const versionRegex = /release-v(\d+\.\d+\.\d+)/;
  const readmeVersionMatch = readmeContent.match(versionRegex);
  if (readmeVersionMatch && readmeVersionMatch[1] === packageVersion) {
  } else if (versionRegex.test(readmeContent)) {
    readmeContent = readmeContent.replace(versionRegex, `release-v${packageVersion}`);
    fs.writeFileSync(readmePath, readmeContent);
    console.log(`✅ Updated README.md version to ${packageVersion}`);
  } else {
    console.warn("⚠️ Version string not found in README.md, skipping update");
  }
} else {
  console.warn("⚠️ README.md not found, skipping update");
}

const logoVersionConstantPath = path.join(__dirname, "..", "src", "domain", "meta.ts");
if (fs.existsSync(logoVersionConstantPath)) {
  let constantsContent = fs.readFileSync(logoVersionConstantPath, "utf8");
  const versionConstRegex = /APP_VERSION = ['"]v(\d+\.\d+\.\d+)['"]/;
  const versionConstMatch = constantsContent.match(versionConstRegex);
  if (versionConstMatch && versionConstMatch[1] === packageVersion) {
    console.log("✓ APP_VERSION constant already up to date");
  } else if (versionConstRegex.test(constantsContent)) {
    constantsContent = constantsContent.replace(versionConstRegex, `APP_VERSION = 'v${packageVersion}'`);
    fs.writeFileSync(logoVersionConstantPath, constantsContent);
    console.log(`✅ Updated APP_VERSION constant to ${packageVersion}`);
  } else {
    console.warn("⚠️ APP_VERSION constant not found in meta.ts, skipping update");
  }
} else {
  console.warn("⚠️ src/domain/meta.ts not found, skipping APP_VERSION constant update");
}

console.log("✅ Version synchronization complete!");
