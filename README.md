<div align="center" id="top">
  <img src="https://raw.githubusercontent.com/QuentindiMeo/BC-Plume/main/icons/logo.svg" alt="BC-Plume Logo" align="left" />
  <h1>:scroll: Player Lightweight Urgent Media Enhancer :film_strip:</h1>
</div>

<div align="center">
  <a href="#memo-description">Description</a> &#xa0; | &#xa0;
  <a href="#gear-requirements">Requirements</a> &#xa0; | &#xa0;
  <a href="#movie_camera-usage--general-information">Usage & General Information</a> &#xa0; | &#xa0;
  <a href="#card_file_box-project-roadmap">Project Roadmap</a>
</div>

&#xa0;

<div align="center">
  <a href="#card_file_box-changelog"><img alt="Last version released" src="https://img.shields.io/badge/release-v1.2.0-blue?logo=semver" /></a>
  <a href="https://github.com/QuentindiMeo/BC-Plume/commits/main"><img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/QuentindiMeo/BC-Plume?color=blueviolet&logo=clarifai" /></a>
</div>
<div align="center">
  <a href="https://github.com/QuentindiMeo/BC-Plume/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/QuentindiMeo/BC-Plume?color=yellow&logo=github" /></a>
  <a href="https://github.com/QuentindiMeo/BC-Plume/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/QuentindiMeo/BC-Plume?color=forestgreen&logo=target" /></a>
  <a href="https://github.com/QuentindiMeo/BC-Plume/graphs/contributors"><img alt="GitHub contributors" src="https://img.shields.io/github/contributors/QuentindiMeo/BC-Plume?color=red&logo=stackedit" /></a>
  <a href="#card_file_box-changelog"><img alt="GitHub repository size" src="https://img.shields.io/github/languages/code-size/QuentindiMeo/BC-Plume?color=blue&logo=frontify" /></a>
</div>

&#xa0;

<div align="center">
  <sup><b>The technical stack at play:</b></sup>

  <img title="TypeScript" src="https://raw.githubusercontent.com/mallowigi/iconGenerator/master/assets/icons/files/typeScript.svg" height="96px" alt="TypeScript" />
  <img title="CSS" src="https://raw.githubusercontent.com/mallowigi/iconGenerator/master/assets/icons/files/css.svg" height="96px" alt="CSS" />
</div>

&#xa0;

## :memo: Description

A cross-browser extension that improves the listening experience on Bandcamp with a volume slider and enhanced progress bar.

**Compatible with Chrome, Firefox, Edge, and other Chromium browsers!**

## 🎵 Features

- **Unified player**: Completely replaces the Bandcamp player with an enhanced version
- **Custom playback controls**: Play/Pause buttons, skip back/forward 10 seconds with a modern design
- **Visible volume slider**: Precise volume control with a sleek slider
- **Volume memory**: Remembers your preferred volume level across pages
- **Enhanced progress bar**: Thicker, colorful bar with a visible thumb
- **Time navigation**: Click and drag to seek within the track
- **Modern interface**: Design with blur and transparency effects

## 🚀 Installation

### Universal Installation (One manifest to rule them all!)

**The extension works with a single manifest on all browsers!**

#### Chrome/Edge/Opera

1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode"
3. "Load unpacked" → Select this folder

#### Firefox (109+)

1. Open `about:debugging`
2. "This Firefox"
3. "Load Temporary Add-on" → Select `manifest.json`

#### Automatic build (optional)

```bash
pnpm run deploy  # Creates build/ folder with all files
```

### Method 2: Icon conversion (optional)

If you want PNG icons instead of SVG:

1. Install Python with pip
2. Install dependencies:

```bash
pip install Pillow cairosvg
```

3. Run the conversion script:

```bash
python convert_icons.py
```

4. Edit `manifest.json` to use `.png` files instead of `.svg`

Alternatively, you can manually convert SVG files to PNG (16x16, 48x48, 128x128) with an online tool.

## 📖 Usage

1. Go to any Bandcamp page with an audio player
2. The extension automatically detects the player and replaces it with its enhanced version
3. Interface layout from top to bottom:
   - **Progress bar** (top): Click to seek within the track
   - **Playback controls** (middle): Play/Pause, skip back/forward 10 seconds
   - **Volume slider** (bottom): Adjust the volume (remembered across pages)
4. The enhanced player completely replaces the original Bandcamp interface

## 🛠️ Technical details

### Content Script

- Runs on all `*.bandcamp.com` domains
- Injects custom controls
- Syncs with native audio events

## 🎨 Customization

You can easily modify the appearance by editing the `styles.css` file. Main variables to change:

```css
/* Main colors */
background: #1da0c3; /* Primary color */
background: rgba(0, 0, 0, 0.8); /* Controls background */

/* Sizes */
height: 8px; /* Bar height */
border-radius: 4px; /* Element rounding */
```

## 🔧 File structure (what truly matters only)

```txt
bc-plume/
├── manifest.json          # Extension configuration
├── src/                   # Main script code
├── styles.css             # Interface styling
├── scripts/               # Browser scripts for building
├── build/                 # Build output directory
├── INSTALLATION.md        # Installation instructions
└── README.md              # This file
```

## 🐛 Troubleshooting

### The extension doesn't load

- Make sure developer mode is enabled
- Reload the extension from `chrome://extensions/`

### Anything else

- Check the developer console (F12) for errors
- Make sure there's an audio player on the page
- Refresh the Bandcamp track/album page
- Try refreshing the page

## 📝 Development notes

This extension uses:

- **Manifest V3**: For modern browser compatibility
- **Cross-Browser API**: Automatic Chrome/Firefox detection
- **Content Scripts**: To interact with Bandcamp pages
- **Storage API + localStorage**: Saves preferences with fallback
- **Vanilla TypeScript**: No external dependencies

The code is fully commented and structured for easy modification and contributions.

## 🔮 Possible future improvements

- [ ] Keyboard shortcut support
- [ ] Localization for multiple languages

---

Developed with ❤️ to enhance the Bandcamp experience
