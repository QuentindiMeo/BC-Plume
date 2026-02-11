#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

console.log("🦊 Building Firefox extension package...");

// Read version from package.json (single source of truth)
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
const packageVersion = packageJson.version;

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
  }
});

staticDirs.forEach((dir) => {
  const srcPath = path.join(__dirname, "..", dir);
  const destPath = path.join(buildDir, dir);
  if (fs.existsSync(srcPath)) {
    fs.cpSync(srcPath, destPath, { recursive: true });
  }
});

const rootManifestPath = path.join(__dirname, "..", "manifest.json");
const rootManifest = JSON.parse(fs.readFileSync(rootManifestPath, "utf8"));
const manifest = {
  ...rootManifest,
  version: packageVersion,
  content_scripts: [
    {
      matches: rootManifest.content_scripts[0].matches,
      js: ["content.js"],
      css: rootManifest.content_scripts[0].css,
      run_at: rootManifest.content_scripts[0].run_at,
    },
  ],
  icons: {
    16: "icons/icon16.png",
    48: "icons/icon48.png",
    128: "icons/icon128.png",
  },
};

fs.writeFileSync(path.join(buildDir, "manifest.json"), JSON.stringify(manifest, null, 2));

console.log("✅ Built Firefox extension (Manifest V3)");

// Copy locales
const localesDir = path.join(__dirname, "..", "_locales");
const localesDestDir = path.join(buildDir, "_locales");
if (fs.existsSync(localesDir)) {
  fs.cpSync(localesDir, localesDestDir, { recursive: true });
  console.log("✅ Copied _locales/");
}

console.log("🎉 Firefox extension package ready in build/firefox/");
