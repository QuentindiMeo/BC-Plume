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

const buildOptions = {
  entryPoints: [path.join(__dirname, "..", "src", "main.ts")],
  bundle: true,
  outfile: path.join(distDir, "content.js"),
  platform: "browser",
  target: "es2022",
  sourcemap: isDev || isTest,
  minify: !isDev && !isTest,
  logLevel: "info",
  // esbuild replaces every occurrence of the token `process.env`
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
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
    console.log(); // newline for readability
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

build();
