// CSS selectors for Bandcamp's native DOM elements.
export enum BC_ELEM_SELECTORS {
  pageBackground = "#pgBd",
  infoSection = "div#name-section",
  trackView = "div.trackView",
  fromAlbum = "span.fromAlbum",
  playerParent = "div.inline_player",
  inlinePlayerTable = "div.inline_player>table",
  audioPlayer = "audio",
  playPause = "div.playbutton",
  songPageCurrentTrackTitle = "h2.trackTitle",
  albumPageCurrentTrackTitle = "a.title_link",
  previousTrack = "div.prevbutton",
  nextTrack = "div.nextbutton",
  trackList = "table#track_table",
  trackRow = "tr.track_row_view",
  playableTrack = ".linked",
  trackTitle = "span.track-title",
  unplayableTrackTitle = "tr.track_row_view div.title",
  trackDuration = "span.time",
  coverArt = "div#tralbumArt img",
}
export type BcElementKey = keyof typeof BC_ELEM_SELECTORS;

export const BC_PLAYER_SELECTORS = new Set<string>([
  "div.inline_player",
  "div#trackInfoInner",
  ".track_play_auxiliary",
  ".track_play_hilite",
  ".track_play_area",
]);
export type BcPlayerSelector = typeof BC_PLAYER_SELECTORS extends Set<infer T> ? T : never;
