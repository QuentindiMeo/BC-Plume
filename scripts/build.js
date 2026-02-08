#!/usr/bin/env node
const esbuild = require("esbuild");
const fs = require("node:fs");
const path = require("node:path");

const isDev = process.argv.includes("--dev");
const isWatch = process.argv.includes("--watch");

console.log(`📦 Building with esbuild (${isDev ? "development" : "production"} mode)...`);

const distDir = path.join(__dirname, "..", "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const buildOptions = {
  entryPoints: [path.join(__dirname, "..", "src", "content.ts")],
  bundle: true,
  outfile: path.join(distDir, "content.js"),
  platform: "browser",
  target: "es2020",
  sourcemap: isDev,
  minify: !isDev,
  logLevel: "info",
};

async function build() {
  try {
    if (isWatch) {
      const context = await esbuild.context(buildOptions);
      await context.watch();
      console.log("👀 Watching for changes...");
    } else {
      await esbuild.build(buildOptions);
      console.log("✅ Build complete!");
    }
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

build();
