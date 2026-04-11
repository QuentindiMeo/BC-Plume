#!/usr/bin/env node
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const versionTag = version.replaceAll(".", "-");

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

const zip = (filename, args, cwd) => {
  const absOutput = path.join(ROOT, filename);
  if (fs.existsSync(absOutput)) fs.rmSync(absOutput);
  const relOutput = path.relative(cwd, absOutput);
  execSync(`zip --quiet -r ${relOutput} ${args}`, { cwd, stdio: "inherit" });
  console.log(`✅ Zipped to ${filename}`);
};

zip("Plume-sources.zip", SOURCES.join(" "), ROOT);

for (const browser of ["chrome", "firefox"]) {
  const buildDir = path.join(ROOT, "build", browser);
  if (!fs.existsSync(buildDir)) {
    console.warn(`⚠️  build/${browser} not found, skipping`);
    continue;
  }
  zip(`build/plume_${versionTag}--${browser}.zip`, ".", buildDir);
}
