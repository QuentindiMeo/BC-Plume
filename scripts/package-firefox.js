#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

console.log("🦊 Building Firefox extension package...");

// Ensure build directory exists
const buildDir = path.join(__dirname, "..", "build", "firefox");
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Copy compiled JavaScript files
const distDir = path.join(__dirname, "..", "dist");
const srcFiles = ["content.js"];

srcFiles.forEach((file) => {
  const srcPath = path.join(distDir, file);
  const destPath = path.join(buildDir, file);
  if (fs.existsSync(srcPath)) {
    let content = fs.readFileSync(srcPath, "utf8");
    // Replace chrome.storage with browser.storage for Firefox compatibility
    content = content.replace(/chrome\.storage/g, "browser.storage");
    fs.writeFileSync(destPath, content);
    console.log(`✅ Copied and adapted ${file} for Firefox`);
  } else {
    console.error(`❌ Missing ${file} - run 'pnpm run build' first`);
    process.exit(1);
  }
});

// Copy static files
const staticFiles = ["styles.css", "README.md"];
const staticDirs = ["icons"];

staticFiles.forEach((file) => {
  const srcPath = path.join(__dirname, "..", file);
  const destPath = path.join(buildDir, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${file}`);
  }
});

staticDirs.forEach((dir) => {
  const srcPath = path.join(__dirname, "..", dir);
  const destPath = path.join(buildDir, dir);
  if (fs.existsSync(srcPath)) {
    fs.cpSync(srcPath, destPath, { recursive: true });
    console.log(`✅ Copied ${dir}/`);
  }
});

// Create Firefox manifest (Manifest V2)
const manifest = {
  manifest_version: 2,
  name: "BC-Plume - Bandcamp Player Enhancer",
  version: "1.2.6",
  description: "Improves the Bandcamp player interface with a volume slider and enhanced playback bar",
  default_locale: "en",
  permissions: ["storage", "*://*.bandcamp.com/*"],
  content_scripts: [
    {
      matches: ["*://*.bandcamp.com/album/*", "*://*.bandcamp.com/track/*"],
      js: ["content.js"],
      css: ["styles.css"],
      run_at: "document_end",
    },
  ],
  icons: {
    16: "icons/icon16.svg",
    48: "icons/icon48.svg",
    128: "icons/icon128.svg",
  },
  applications: {
    gecko: {
      id: "bandcamp-player-enhancer@extension.local",
      strict_min_version: "109.0",
    },
  },
};

fs.writeFileSync(path.join(buildDir, "manifest.json"), JSON.stringify(manifest, null, 2));

console.log("✅ Created Firefox manifest.json (Manifest V2)");
console.log("🎉 Firefox extension package ready in build/firefox/");
