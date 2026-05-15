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
  let metaChanged = false;

  const versionConstRegex = /APP_VERSION = ['"]v(\d+\.\d+\.\d+)['"]/;
  const versionConstMatch = constantsContent.match(versionConstRegex);
  if (versionConstMatch && versionConstMatch[1] !== packageVersion) {
    constantsContent = constantsContent.replace(versionConstRegex, `APP_VERSION = 'v${packageVersion}'`);
    console.log(`✅ Updated APP_VERSION constant to ${packageVersion}`);
    metaChanged = true;
  } else if (!versionConstMatch) {
    console.warn("⚠️ APP_VERSION constant not found in meta.ts, skipping update");
  }

  const clgPath = path.join(__dirname, "..", "CHANGELOG.md");
  if (fs.existsSync(clgPath)) {
    const clgContent = fs.readFileSync(clgPath, "utf8");

    const clgReleaseDateRegex = /_\*\*\[\d+\.\d+\.\d+\]\*\*\s+([A-Za-z]+) (\d{1,2}) (\d{4})_:/;
    const clgReleaseDateMatch = clgContent.match(clgReleaseDateRegex);
    if (clgReleaseDateMatch) {
      const MONTH_MAP = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
      const [, month, day, year] = clgReleaseDateMatch;
      const monthNum = MONTH_MAP[month];
      if (!monthNum) {
        console.warn(`⚠️ Unrecognized month "${month}" in CHANGELOG.md, skipping date update`);
      } else {
        const isoDate = `${year}-${String(monthNum).padStart(2, "0")}-${String(Number(day)).padStart(2, "0")}`;
        const releaseDateConstRegex = /APP_RELEASE_DATE = ['"][^'"]*['"]/;
        const currentDateMatch = constantsContent.match(releaseDateConstRegex);
        if (currentDateMatch) {
          const currentDate = currentDateMatch[0].match(/['"]([^'"]*)['"]/)?.[1];
          if (currentDate !== isoDate) {
            constantsContent = constantsContent.replace(releaseDateConstRegex, `APP_RELEASE_DATE = '${isoDate}'`);
            console.log(`✅ Updated APP_RELEASE_DATE to ${isoDate}`);
            metaChanged = true;
          }
        } else {
          console.warn("⚠️ APP_RELEASE_DATE constant not found in meta.ts, skipping update");
        }
      }
    } else {
      console.warn("⚠️ Could not parse release date from CHANGELOG.md, skipping update");
    }
  }

  if (metaChanged) fs.writeFileSync(logoVersionConstantPath, constantsContent);
} else {
  console.warn("⚠️ src/domain/meta.ts not found, skipping meta.ts constant update");
}

console.log("✅ Version synchronization complete!");
