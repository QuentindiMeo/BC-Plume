<div align="center" id="top">
  <img src="https://raw.githubusercontent.com/QuentindiMeo/BC-Plume/main/icons/logo.svg" alt="BC-Plume Logo" width="256px" />
  <h2>🗃️ Full-Fleshed Changelog 🗃️</h2>
</div>

- Later releases to come with new features!! Learn more about what's next by checking the [issues tab](https://github.com/QuentindiMeo/BC-Plume/issues).

  - _**[1.3.3]** Mar 15 2026_: Digit Hotkeys, Loop Mode, Hexagon, Hotkey Customization & Release Toast [#106](https://github.com/QuentindiMeo/BC-Plume/pull/106)  
  The project's SEO is enhanced with a [promo video](https://www.youtube.com/watch?v=rsXqvNrXYn8), reddit posts ([1](https://www.reddit.com/r/chrome_extensions/comments/1rh0onk/i_revamped_bandcamps_audio_player_ux_ui), [2](https://www.reddit.com/r/extensions/comments/1rh0ngh/i_revamped_bandcamps_audio_player_ux_ui)), and a [Twitter/X account](https://x.com/PlumeBandcamp) to reach a wider audience and keep users updated on new features and releases. The extension is also submitted to the [Product Hunt](https://www.producthunt.com/products/plume-5) and [AlternativeTo](https://alternativeto.net/software/bc-plume).  
  Hotkeys for track seeking are introduced, using digit keys (`0` to `9`) for quick access to specific percentages of the track's duration (e.g. `5` for 50%).  
  A looping mechanism is added, allowing users to cycle through loop modes (none → collection → track → none) with a dedicated button.  
  The extension popup is introduced, allowing users to customize Plume hotkeys.  
  A toast notification system is added—it is used to present new Plume releases to the user.  
  Adjustments are made to match hexagonal architecture principles, following the implementation of Clean Architecture guidelines in the previous release.

    - _**[1.3.2.1]** Feb 24 2026_: Oops! The new architecture broke the Firefox version, let's hotfix it... 🤣 [#094](https://github.com/QuentindiMeo/BC-Plume/pull/94)  
    Invalid value types, invalid SVG properties, wrong gecko ID... I did do an oopsie.

  - _**[1.3.2]** Feb 23 2026_: Codebase Restructuration, Mute Mechanic, Fullscreen Impovements & SEO [#081](https://github.com/QuentindiMeo/BC-Plume/pull/81)  
  Claude Code becomes QDM's assistant for the software architecture refactoring phase, helping to fix inconsistencies and security issues.  
  Using Claude, the software architecture is completely rehauled to improve maintainability, scalability, and separation of concerns.  
  A healthcheck mechanism is implemented to alert the user if the extension fails to inject properly.  
  The project's SEO is revamped with better metadata to improve visibility and attract more users; store pages are updated—a [Linktree](https://linktr.ee/bc_plume) is created.  
  The demo GIF is updated.  
  The need for `Ctrl+Alt+...` on hotkeys is removed to make them easier to use.  
  The mute/unmute mechanism is introduced (hotkey: `M`), allowing users to quickly toggle sound without adjusting the volume slider.  
  The Bandcamp release presentation on the fullscreen view is duplicated from the normal view—not created from scratch.  
  English is set as fallback for any unknown message key in a foreign language—the key itself is returned if it's not defined in English either.  
  The app is bundled using esbuild, a pre-commit hook is added to ensure Prettier formatting.

  - _**[1.3.1]** Feb 01 2026_: Fullscreen Improvements, Runtime Display & Keyboard Shortcuts [#076](https://github.com/QuentindiMeo/BC-Plume/pull/76)  
  Hotkeys are added (`Ctrl+Alt+...`) for play/pause (`space`), rewind/forward seeking (`←`/`→`), previous/next track (`PgUp`/`PgDown`), volume control (`↑`/`↓`), and fullscreen toggle (`F`).  
  The album and title are displayed in fullscreen mode.  
  The total runtime of the album is displayed in the track display—not on the fullscreen view.  
  The cover art and presentation section (left side) are made selectable, allowing users to easily copy the album title and artist name, or extract the cover art.

- _**[1.3.0]** Jan 18 2026_: **Pedal To The Metal** — Fullscreen Mode, Playback Bugfixes & Spanish Language Support [#067](https://github.com/QuentindiMeo/BC-Plume/pull/67)  
Spanish localization is added.  
On single track pages, the track display and the rewind feature are fixed.  
Bugs related to updates (play/pause button icon, ARIA labels for track display, seeking in progress) are fixed.

  - _**[1.2.6]** Nov 10 2025_: Volume Slider, a11y Labels, Track Restart & Refactoring [#060](https://github.com/QuentindiMeo/BC-Plume/pull/60)  
  The volume slider is redesigned for better aesthetics and usability.  
  The "previous track" button restarts the current track if it's already playing.  
  Accessibility concerns are addressed by adding ARIA labels to interactive elements, improving screen reader support.  
  The app version is displayed below the logo.  
  The donation link on the README is updated to point to the new ko-fi account.

  - _**[1.2.5]** Sep 08 2025_: Deductive Duration Display & Sticky Player [#048](https://github.com/QuentindiMeo/BC-Plume/pull/48)  
  Redditors point out: Chrome app icons are updated; before that, the Chrome app could not be installed due to compatibility issues.  
  The user can choose between the standard duration display of the track (total duration) or a deductive one (remaining time).  
  The player now stays visible at the top of the screen when scrolling down, ensuring easy access to playback controls.

  - _**[1.2.4]** Sep 04 2025_: Luminance Check, Track Numbering & Demo [#042](https://github.com/QuentindiMeo/BC-Plume/pull/42)  
  The track display shows the current track number and total tracks, and the volume slider is redesigned for better usability.  
  The track display's color depends on the color theme chosen by the artist, and its perceived brightness is adjusted based on the background color for better visibility.  
  The demo GIF is updated to reflect the new UI changes (since version 1.2.0).  
  The application is promoted by me [on Reddit](https://www.reddit.com/r/BandCamp/comments/1n9x9b0/i_humbly_reworked_bandcamps_audio_player_with_a).

  - _**[1.2.3]** Aug 19 2025_: Logger & Localization [#038](https://github.com/QuentindiMeo/BC-Plume/pull/38)  
  A customized logger is implemented to provide structured and informative console outputs.  
  Plume is fully localized in English and French.

  - _**[1.2.2]** Aug 17 2025_: Better Progress Slider & Slight UI Adjustments [#035](https://github.com/QuentindiMeo/BC-Plume/pull/35)

  - _**[1.2.1]** Jul 31 2025_: Repository Improvement & Extension Presentation [#030](https://github.com/QuentindiMeo/BC-Plume/pull/30)  
  The README is enriched and the CHANGELOG (this file) is created.  
  A demo GIF of version 1.2.0 is added to the README to showcase the extension's features and UI.

- _**[1.2.0]** Jul 30 2025_: **Pretty Boy** — Logo Introduction & UI Rework [#028](https://github.com/QuentindiMeo/BC-Plume/pull/28)  
Plume gets a logo, ideated by QDM and designed by the talented [Rebecca Șes](https://www.linkedin.com/in/rebecca-ses).  
The UI is revamped with a more modern and cohesive design, featuring a set color scheme, typography, and layout.  
This is the first release deployed on the Chrome Web Store and Firefox Add-ons.

- _**[1.1.0]** Jul 28 2025_: **First Release** — The original Bandcamp player is fully replaced by Plume. [#018](https://github.com/QuentindiMeo/BC-Plume/pull/18_)

  - _**[1.0.2]** Jul 28 2025_: Project configuration is rounded up, song title display and playback are handled. [#013](https://github.com/QuentindiMeo/BC-Plume/pull/13)

  - _**[1.0.1]** Jul 28 2025_: The project is renamed to _Plume_, GitHub Issue templates are added. [#009](https://github.com/QuentindiMeo/BC-Plume/pull/9)

- _**[1.0.0]** Jul 28 2025_: **Hello World!** — The project is drafted, under the name _MBAPPE_. [#001](https://github.com/QuentindiMeo/BC-Plume/pull/1)  
"MBAPPE" for Multimedia Bandcamp Pluripotent Player Extension. That was way too nerdy of a name. 🐢

<br />

[Back to top](#top)
