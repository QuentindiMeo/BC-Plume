# BC-Plume Installation

## 🎯 TypeScript-based Extension

This extension is built with **TypeScript** for better type safety and maintainability.  
It compiles to JavaScript and supports all modern browsers.

### ✅ Prerequisites

- **For Users**: Any modern browser (Chrome/Firefox/Edge/Opera)
- **For Developers**:
  - Node.js 18.0+
  - pnpm 10.0+
  - TypeScript 5.8+

### 📥 Installation Methods

## Method 1: Quick Installation (Pre-built)

If you just want to use the extension without building from source:

### 1️⃣ Download

1. Download this repository as a ZIP file (or clone it)
2. (if ZIP file) Extract it to a folder

### 2️⃣ Browser-specific Installation

#### Chrome/Edge/Opera/Brave... (Chromium-based)

1. Open `chrome://extensions/` (or equivalent)
2. Enable **"Developer mode"** (top right corner)
3. Click **"Load unpacked"**
4. Select the project folder
5. ✅ The extension is installed!

#### Firefox

1. Open `about:debugging`
2. Click **"This Firefox"**
3. Click **"Load Temporary Add-on"**
4. Select the `manifest.json` file
5. ✅ The extension is installed!

## Method 2: Build from TypeScript Source

For developers or to get the latest features:

### 1️⃣ Setup Development Environment

```bash
git clone https://github.com/QuentindiMeo/BC-Plume # Clone or download the repository
cd BC-Plume

pnpm install    # Install dependencies
```

### 2️⃣ Build the Extension

```bash
pnpm run build  # Quick build (development with source maps)
pnpm run prod   # Production build (optimized, no source maps)
pnpm run watch  # Watch mode for development
pnpm run deploy # Full packaging for distribution
```

### 3️⃣ Development Commands

```bash
pnpm run clean       # Clean build artifacts

pnpm run dev         # Development mode (clean + watch)

# Code quality
pnpm run lint        # Check code style
pnpm run format      # Fix formatting issues
pnpm run type-check  # TypeScript type checking only
```

### 4️⃣ Install Built Extension

After building, you can install the extension:

#### Option A: Direct Installation (Development)

- **Chrome**: Load the main project folder as unpacked extension (manifest.json points to dist/)
- **Firefox**: Load `manifest.json` as temporary add-on

#### Option B: Browser-Specific Packages (Distribution)

- **Chrome**: Load `build/chrome/` folder as unpacked extension
- **Firefox**: Load `build/firefox/manifest.json` as temporary add-on
- **Production**: Use `pnpm run deploy` to create optimized packages

## 🎯 Verify Installation

- Go to any Bandcamp page
- The enhanced interface appears automatically
- Volume is saved between pages

## 🔧 Icon Conversion (Optional)

If you want to convert SVGs to PNGs for certain browsers:

### Option A: Online Tool (recommended)

- Go to <https://convertio.co/svg-png/> or <https://svgtopng.com/>
- Convert each SVG file in the `icons/` folder:
  - icon16.svg → icon16.png (16x16 pixels)
  - icon48.svg → icon48.png (48x48 pixels)
  - icon128.svg → icon128.png (128x128 pixels)

### Option B: With Python (if available)

```bash
pip install pillow cairosvg
python convert_icons.py
```

## 🔧 Troubleshooting

### TypeScript Build Issues

#### "tsc: command not found"

- **Solution**: Install TypeScript globally: `pnpm install -g typescript`
- **Alternative**: Use local version: `npx tsc`

#### Build fails with type errors

- **Solution**: Check TypeScript version compatibility
- **Debug**: Run `pnpm run type-check` to see specific errors
- **Fix**: Update type definitions: `pnpm update @types/chrome @types/node`

#### Missing dist/ folder

- **Solution**: Run `pnpm run build` before installation
- **Alternative**: Use `pnpm run dev` for watch mode during development

### Browser Extension Issues

#### Firefox: "Extension not compatible"

- **Solution**: Make sure you have Firefox 109+
- **Alternative**: The extension will use localStorage as a fallback

#### Chrome: "Invalid manifest"

- **Solution**: Check that `manifest.json` is not corrupted
- **Debug**: Check the extensions console

#### No visible interface

- **Solution**: Reload the Bandcamp page
- **Debug**: Open F12 → Console to view logs

## 🔄 Update

### Manual Update

1. Download the newest version from this repository (or `git pull` on `develop`)
2. (if ZIP file) Replace the existing files
3. Reload the extension in your browser

## 🗑️ Uninstallation

### Chromium-based browsers

1. `chrome://extensions/`
2. Click "Remove" on the extension

### Firefox browser

1. `about:addons`
2. Extensions → Remove

Saved preferences are automatically deleted.

---

## 📞 Support

**Having an issue?** Open a GitHub issue, preferably with:

- Browser version
- Extension version
- Problem description
- Console logs (F12)
