#!/usr/bin/env node
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const OUTPUT = path.join(ROOT, "Plume-sources.zip");

const SOURCES = [
  "_locales/",
  "icons/",
  "scripts/",
  "src/",
  "eslint.config.js",
  "manifest.json",
  "package.json",
  "styles.css",
  "tsconfig.json",
];

if (fs.existsSync(OUTPUT)) fs.rmSync(OUTPUT);

execSync(`zip --quiet -r Plume-sources.zip ${SOURCES.join(" ")}`, { cwd: ROOT, stdio: "inherit" });

console.log("✅ Sources zipped to Plume-sources.zip");
