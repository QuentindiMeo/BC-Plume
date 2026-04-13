#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const VALID_BROWSERS = ["chrome", "firefox"];

const deployPackage = (browser) => {
  if (!VALID_BROWSERS.includes(browser)) {
    console.error(`❌ Invalid browser specified. Use one of: ${VALID_BROWSERS.join(", ")}`);
    process.exit(1);
  }

  if (browser === "chrome") {
    console.debug("📦 Deploying Chrome extension package...");
  } else if (browser === "firefox") {
    console.debug("🦊 Deploying Firefox extension package...");
  }

  // Read version from package.json (single source of truth)
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
  const packageVersion = packageJson.version;

  // Ensure deploy directory exists
  const deployDir = path.join(__dirname, "..", "build", browser);
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }

  // Copy compiled JavaScript files
  const distDir = path.join(__dirname, "..", "dist");
  const srcFiles = ["content.js", "popup.js", "popup.html", "popup.css", "tailwind.css", "styles.css"];

  srcFiles.forEach((file) => {
    const srcPath = path.join(distDir, file);
    const destPath = path.join(deployDir, file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
    } else {
      console.error(`❌ Missing ${file} - run 'pnpm run deploy' first`);
      process.exit(1);
    }
  });

  // Copy static files
  const staticFiles = ["README.md"];
  const staticDirs = ["icons", "_locales"];

  staticFiles.forEach((file) => {
    const srcPath = path.join(__dirname, "..", file);
    const destPath = path.join(deployDir, file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  });

  staticDirs.forEach((dir) => {
    const srcPath = path.join(__dirname, "..", dir);
    const destPath = path.join(deployDir, dir);
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
        css: rootManifest.content_scripts[0].css.map((p) => path.basename(p)),
        run_at: rootManifest.content_scripts[0].run_at,
      },
    ],
    icons: {
      16: "icons/icon16.png",
      48: "icons/icon48.png",
      128: "icons/icon128.png",
    },
  };

  fs.writeFileSync(path.join(deployDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`🎉 Deployed Plume v${packageVersion} to build/${browser}/`);
};

deployPackage("chrome");
deployPackage("firefox");