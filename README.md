<div align="center" id="top">
  <img src="https://raw.githubusercontent.com/QuentindiMeo/BC-Plume/main/icons/logo.svg" alt="BC-Plume Logo" width="256px" />
  <h2>:notes:Bandcamp Player Lightweight Ultimate Media Enhancer :feather:</h2>
</div>

<div align="center">
  <a href="#memo-description">Description</a> &#xa0; | &#xa0;
  <a href="#rocket-installation">Installation</a> &#xa0; | &#xa0;
  <a href="#open_book-usage--general-information">Usage & General Information</a> &#xa0; | &#xa0;
  <a href="#bug-troubleshooting">Troubleshooting</a> &#xa0; | &#xa0;
  <a href="#card_file_box-project-roadmap">Project Roadmap</a>
</div>

&#xa0;

<div align="center">
  <a href="#memo-description"><img src="https://github.com/user-attachments/assets/9140c05d-2b24-4fe1-8bd7-dde66ee4e26b" alt="Demo gif of v1.2.0" width="800px" /></a>
</div>

&#xa0;

<div align="center">
  <a href="#card_file_box-changelog"><img alt="Last version released" src="https://img.shields.io/badge/release-v1.2.1-blue?logo=semver" /></a>
  <a href="https://github.com/QuentindiMeo/BC-Plume/commits/main"><img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/QuentindiMeo/BC-Plume?color=blueviolet&logo=clarifai" /></a>
</div>
<div align="center">
  <a href="https://github.com/QuentindiMeo/BC-Plume/graphs/contributors"><img alt="GitHub contributors" src="https://img.shields.io/github/contributors/QuentindiMeo/BC-Plume?color=red&logo=stackedit" /></a>
  <a href="https://github.com/QuentindiMeo/BC-Plume/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/QuentindiMeo/BC-Plume?style=flat&color=%23ffe937&logo=github" /></a>
  <a href="https://github.com/QuentindiMeo/BC-Plume/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/QuentindiMeo/BC-Plume?color=forestgreen&logo=target" /></a>
  <a href="#card_file_box-changelog"><img alt="GitHub repository size" src="https://img.shields.io/github/languages/code-size/QuentindiMeo/BC-Plume?color=blue&logo=frontify" /></a>
</div>
&nbsp;
<div align="center">
  <sup><b>The technical stack at play:</b>&nbsp;</sup>
  <img title="TypeScript" src="https://raw.githubusercontent.com/mallowigi/iconGenerator/master/assets/icons/files/typeScript.svg" width="36px" alt="TypeScript" />
  <img title="CSS" src="https://raw.githubusercontent.com/mallowigi/iconGenerator/master/assets/icons/files/css.svg" width="36px" alt="CSS" />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <sup><b>if you wish to tip me:&nbsp;</b></sup>
  <a href="https://ko-fi.com/quentindimeo">
    <img alt="ko-fi tip button" src="https://storage.ko-fi.com/cdn/logomarkLogo.png" height="40px" />
  </a>
  <a href="https://www.paypal.com/donate/?hosted_button_id=LQCF9J9X4EDZL">
    <img alt="PayPal donate button" src="https://i.imgur.com/abmsLLY.png" height="40px" />
  </a>
</div>

&#xa0;

## :memo: Description

A cross-browser extension that improves the listening experience on Bandcamp with a volume slider and enhanced progress bar.  
**Compatible with Chrome, Firefox, Edge, and other Chromium browsers!**

### :musical_note: Features

- **Unified player**: Completely replaces the Bandcamp player with an enhanced version
- **Time navigation**: Click and drag to seek within the track
- **Custom playback controls**: Play/Pause buttons, skip back/forward 10 seconds with a modern design
- **Visible volume slider**: Precise volume control with a sleek slider
  - **Volume memory**: Remembers your preferred volume level across pages

## :rocket: Installation

Either install the extension from the Chrome Web Store (_coming soon!_) or the Mozilla Add-ons site (_coming soon!_).  
If you want to install it manually, clone this repository and follow the steps below.

### Universal Installation (One manifest to rule them all!)

```bash
# Install project dependencies
pnpm i

# Creates build/ folder with all files
pnpm run deploy
```

#### Chrome/Edge/Opera

1. Open a new tab and enter `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode"
3. "Load unpacked" → Select this folder

#### Firefox (109+)

1. Open a new tab and enter `about:debugging`
2. Click on "This Firefox" on the left sidebar
3. "Load Temporary Add-on" → Select `manifest.json`

## :open_book: Usage & General Information

1. Go to any Bandcamp **album or track page**
2. The extension replaces the Bandcamp player with the Plume player
3. Interface layout from top to bottom:
   - **Track title**: Displays the current track name
   - **Progress bar**: Click to seek within the track
   - **Playback controls**: Play/Pause, skip back/forward 10 seconds, go to next/previous track
   - **Volume slider**: Adjust the volume (remembered across pages)

### 📝 Development notes

This extension uses:

- **Manifest V3**: For modern browser compatibility
- **Cross-Browser API**: Automatic Chrome/Firefox detection
- **Content Scripts**: To interact with Bandcamp pages
- **Storage API + localStorage**: Saves preferences with fallback
- **Vanilla TypeScript**: No external dependencies

The code is fully commented and structured for easy modification and contributions.

## :bug: Troubleshooting

### The extension doesn't load

- Make sure developer mode is enabled
- Reload the extension from `chrome://extensions/` (or `about:debugging` for Firefox)

### Anything else

- Check the developer console (F12) for errors
- Make sure there's an audio player on the page
- Refresh the Bandcamp track/album page
- Try refreshing the page

If the issue persists, [**open an issue**](https://github.com/QuentindiMeo/BC-Plume/issues) with details about your browser and the page URL.

## :card_file_box: Project Roadmap

Find detailed versioning in the [CHANGELOG.md](https://github.com/QuentindiMeo/BC-Plume/blob/main/CHANGELOG.md) file.

- _**[1.3.0]** Coming later..._: **Pedal To The Metal** — New features are added to Plume. [#???](#card_file_box-project-roadmap)
- _**[1.2.0]** Jul 30 2025_: **Pretty boy** — Plume gets a logo & UI rework. [#028](https://github.com/QuentindiMeo/BC-Plume/pull/28)
- _**[1.1.0]** Jul 28 2025_: **First Release** — The original Bandcamp player is fully replaced by Plume. [#018](https://github.com/QuentindiMeo/BC-Plume/pull/18)
- _**[1.0.0]** Jul 28 2025_: **Hello World!** — The project is drafted, under the name _MBAPPE_.

### 🔮 Possible future improvements

All of them are listed in the [issues](https://github.com/QuentindiMeo/BC-Plume/issues).  
Those with the 🚀 emoji are new features, those with the ↗️ emoji are improvements!

---

Developed with ❤️ to enhance the Bandcamp experience

<br />

[Back to top](#top)
