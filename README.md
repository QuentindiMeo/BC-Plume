<div align="center" id="top">
  <img src="https://raw.githubusercontent.com/QuentindiMeo/BC-Plume/main/icons/logo.svg" alt="BC-Plume Logo" width="256px" />
  <h2>Plume — Bandcamp Player Lightweight Ultimate Media Enhancer</h2>
</div>

<div align="center">
  <a href="#-description">Description</a> &#xa0; | &#xa0;
  <a href="#-installation">Installation</a> &#xa0; | &#xa0;
  <a href="#-usage--information">Usage & Information</a> &#xa0; | &#xa0;
  <a href="#-troubleshooting">Troubleshooting</a> &#xa0; | &#xa0;
  <a href="#%EF%B8%8F-roadmap">Roadmap</a>
</div>

&#xa0;

<div id="badges1" align="center">
  <a href="#card_file_box-changelog"><img alt="Last version released" src="https://img.shields.io/badge/release-v1.3.3-blue?logo=semver" /></a>
  <a href="https://chromewebstore.google.com/detail/bc-plume-bandcamp-player/ldojecagppaiodalfjnhandfjkiljplm"><img alt="Chrome store rating" src="https://img.shields.io/chrome-web-store/rating/ldojecagppaiodalfjnhandfjkiljplm?logo=googlechrome" /></a>
  <a href="https://addons.mozilla.org/fr/firefox/addon/bc-plume"><img alt="Firefox store rating" src="https://img.shields.io/amo/rating/bc-plume?logo=firefoxbrowser" /></a>
  <a href="https://github.com/QuentindiMeo/BC-Plume/graphs/contributors"><img alt="GitHub contributors" src="https://img.shields.io/github/contributors/QuentindiMeo/BC-Plume?color=red&logo=stackedit" /></a>
</div>
<div id="badges2" align="center">
  <a href="https://github.com/QuentindiMeo/BC-Plume/commits/main"><img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/QuentindiMeo/BC-Plume?color=blueviolet&logo=clarifai" /></a>
  <a href="https://github.com/QuentindiMeo/BC-Plume/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/QuentindiMeo/BC-Plume?style=flat&color=%23ffe937&logo=github" /></a>
  <a href="https://github.com/QuentindiMeo/BC-Plume/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/QuentindiMeo/BC-Plume?color=forestgreen&logo=target" /></a>
  <a href="#card_file_box-changelog"><img alt="GitHub repository size" src="https://img.shields.io/github/languages/code-size/QuentindiMeo/BC-Plume?color=blue&logo=frontify" /></a>
</div>

&#xa0;

<div id="demo" align="center">
  <a href="#memo-description"><img alt="BC-Plume Bandcamp player enhancer demo — volume slider, seek bar, fullscreen mode; demo gif of v1.3.2" src="https://github.com/user-attachments/assets/3f72cfa0-7c42-4aa5-8e9c-4a67b617ce17" width="800px" /></a>
</div>

<div id="details" align="center">
  <sup><b>The technical stack at play:</b>&nbsp;</sup>
  <img title="TypeScript" src="https://raw.githubusercontent.com/mallowigi/iconGenerator/master/assets/icons/files/typeScript.svg" width="36px" alt="TypeScript" />
  <img title="CSS" src="https://raw.githubusercontent.com/mallowigi/iconGenerator/master/assets/icons/files/css.svg" width="36px" alt="CSS" />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <sup><b>if you wish to tip me:&nbsp;</b></sup>
  <a href="https://ko-fi.com/quentindimeo">
    <img alt="ko-fi tip button" src="https://storage.ko-fi.com/cdn/brandasset/v2/support_me_on_kofi_blue.png" height="40px" />
  </a>
  <!-- <a href="https://www.paypal.com/donate/?hosted_button_id=LQCF9J9X4EDZL">
    <img alt="PayPal donate button" src="https://i.imgur.com/abmsLLY.png" height="40px" />
  </a> -->
</div>

&#xa0;

## 📝 Description

A cross-browser web extension that improves the listening experience on Bandcamp with a volume slider and enhanced progress bar.  
**Compatible with Chrome, Firefox, Edge, and all other Chromium web browsers!**

### 🎵 Features

- **Unified player**: Completely replaces the Bandcamp player with an enhanced version
- **Time navigation**: Click and drag to seek within the track seamlessly
  - **Time display mode**: Switch between track duration and remaining time (remembered across pages)
- **Custom playback controls**: Play/Pause buttons, skip back/forward 10 seconds with a modern design
- **Visible volume slider**: Precise volume control with a sleek slider (remembered across pages)
- **Fullscreen mode**: Enjoy the player in fullscreen for an immersive experience
  - **Responsive design**: Adapts to different screen sizes and devices
- **Several languages**: Enjoy Plume in English 🇺🇸, French 🇫🇷, Spanish 🇪🇸... (more on demand!)

## 🚀 Installation

Either install the extension from the [Chrome Web Store](https://chromewebstore.google.com/detail/bc-plume-bandcamp-player/ldojecagppaiodalfjnhandfjkiljplm) or the [Mozilla Add-ons site](https://addons.mozilla.org/fr/firefox/addon/bc-plume).  
If you want to install it manually (for local build or development), follow the instructions in [**the installation file**](./INSTALLATION.md).

## 📖 Usage & Information

1. Go to any Bandcamp **album or track page**
2. The extension replaces the original player with the **Plume player**
3. The enjoyment is yours! :sunglasses: and the pleasure is mine :blush:

### 📝 Development notes

This extension uses:

- **Manifest V3**: For modern browser compatibility
- **Cross-Browser API**: Automatic Chromium/Firefox detection
- **Content Scripts**: To interact with Bandcamp pages
- **Storage API & localStorage**: Saves preferences in browser cache
- **Vanilla TypeScript**: No external dependencies

The code is fully commented and structured for understanding, easy contribution and modification.

## 🐛 Troubleshooting

### The extension doesn't load (developer mode)

- Make sure developer mode is enabled
- Reload the extension from `chrome://extensions/` (or `about:debugging` for Firefox)

### Any other problem

- Check the developer console (F12) for errors
- Make sure there's an audio player on the page
- Refresh the Bandcamp track/album page
- Try refreshing the page

If the issue persists, [**open an issue**](https://github.com/QuentindiMeo/BC-Plume/issues) with details about your web browser and the page URL.

## 🗃️ Roadmap

Find detailed versioning in the [CHANGELOG.md](https://github.com/QuentindiMeo/BC-Plume/blob/main/CHANGELOG.md) file.

- _**[1.3.0]** Jan 18 2026_: **Pedal To The Metal** — Fullscreen mode, playback bugfixes and Spanish language support. [#67](https://github.com/QuentindiMeo/BC-Plume/pull/67)
- _**[1.2.5]** Sep 08 2025_: official release — Word is spread on Reddit, Plume is ready for use. [#048](https://github.com/QuentindiMeo/BC-Plume/pull/48)
- _**[1.2.0]** Jul 30 2025_: **Pretty Boy** — Plume gets a logo & UI rework. [#028](https://github.com/QuentindiMeo/BC-Plume/pull/28)
- _**[1.1.0]** Jul 28 2025_: **First Release** — The original Bandcamp player is fully replaced by Plume. [#018](https://github.com/QuentindiMeo/BC-Plume/pull/18)
- _**[1.0.0]** Jul 28 2025_: **Hello World!** — The project is drafted, under the name _MBAPPE_.

### 🔮 Possible future improvements

All of them are listed in the [issues](https://github.com/QuentindiMeo/BC-Plume/issues).  
Those with the 🚀 emoji are new features, those with the ↗️ emoji are improvements!  
Don't hesitate to suggest new ideas by **opening an issue** yourself!

---

Developed with ❤️ to enhance the Bandcamp experience

<br />

[Back to top](#top)
