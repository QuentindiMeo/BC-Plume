#!/usr/bin/env node
const esbuild = require("esbuild");
const fs = require("node:fs");
const path = require("node:path");

const isDev = process.argv.includes("--dev");
const isTest = process.argv.includes("--test");
const isWatch = process.argv.includes("--watch");

let mode;
if (isTest) {
  mode = "testing";
} else if (isDev) {
  mode = "development";
} else {
  mode = "production";
}

console.log(`📦 Building with esbuild (${mode} mode)...`);

const distDir = path.join(__dirname, "..", "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const sharedOptions = {
  bundle: true,
  platform: "browser",
  target: "es2022",
  sourcemap: isDev || isTest,
  minify: !isDev && !isTest,
  logLevel: "info",
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
};

const contentBuildOptions = {
  ...sharedOptions,
  entryPoints: [path.join(__dirname, "..", "src", "main.ts")],
  outfile: path.join(distDir, "content.js"),
};

const popupBuildOptions = {
  ...sharedOptions,
  entryPoints: [path.join(__dirname, "..", "src", "popup", "popup.ts")],
  outfile: path.join(distDir, "popup.js"),
};

const copyPopupAssets = () => {
  const srcDir = path.join(__dirname, "..", "src", "popup");
  fs.copyFileSync(path.join(srcDir, "popup.html"), path.join(distDir, "popup.html"));
  fs.copyFileSync(path.join(srcDir, "popup.css"), path.join(distDir, "popup.css"));
};

async function build() {
  try {
    if (isWatch) {
      const contentCtx = await esbuild.context(contentBuildOptions);
      const popupCtx = await esbuild.context(popupBuildOptions);
      await Promise.all([contentCtx.watch(), popupCtx.watch()]);
      copyPopupAssets();
      console.log("👀 Watching for changes...");
    } else {
      await Promise.all([esbuild.build(contentBuildOptions), esbuild.build(popupBuildOptions)]);
      copyPopupAssets();
      console.log("✅ Build complete!");
    }
    console.log(); // newline for readability
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

build();
