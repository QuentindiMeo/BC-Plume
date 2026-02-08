#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

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
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${file}`);
  } else {
    console.error(`❌ Missing ${file} - run 'pnpm run build' first`);
    process.exit(1);
  }
});

// Copy static files
const staticFiles = ["styles.css", "README.md"];
const staticDirs = ["icons", "_locales"];

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

// Create Firefox manifest (Manifest V3)
const manifest = {
  manifest_version: 3,
  name: "BC-Plume - Bandcamp Player Enhancer",
  version: "1.3.1",
  description: "Improves the Bandcamp player interface with a volume slider and enhanced playback controls.",
  default_locale: "en",
  permissions: ["storage"],
  host_permissions: ["*://*.bandcamp.com/*"],
  content_scripts: [
    {
      matches: ["*://*.bandcamp.com/album/*", "*://*.bandcamp.com/track/*"],
      js: ["content.js"],
      css: ["styles.css"],
      run_at: "document_end",
    },
  ],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'none'",
  },
  icons: {
    16: "icons/icon16.svg",
    48: "icons/icon48.svg",
    128: "icons/icon128.svg",
  },
  browser_specific_settings: {
    gecko: {
      id: "bandcamp-player-enhancer@extension.local",
      strict_min_version: "109.0",
    },
  },
};

fs.writeFileSync(path.join(buildDir, "manifest.json"), JSON.stringify(manifest, null, 2));

console.log("✅ Created Firefox manifest.json (Manifest V3)");

// Copy locales
const localesDir = path.join(__dirname, "..", "_locales");
const localesDestDir = path.join(buildDir, "_locales");
if (fs.existsSync(localesDir)) {
  fs.cpSync(localesDir, localesDestDir, { recursive: true });
  console.log("✅ Copied _locales/");
}

console.log("🎉 Firefox extension package ready in build/firefox/");
