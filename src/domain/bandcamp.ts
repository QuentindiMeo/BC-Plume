export enum TIME_DISPLAY_METHOD {
  DURATION = "duration",
  REMAINING = "remaining",
}
export type TimeDisplayMethodType = `${TIME_DISPLAY_METHOD}`;

export interface DebugControl {
  index: number;
  tagName: string;
  classes: string;
  title: string;
  text: string;
  onclick: string;
}

export enum BC_ELEM_IDENTIFIERS {
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
  trackTitle = "span.track-title",
  trackDuration = "span.time",
  coverArt = "div#tralbumArt img",
}

export const BC_PLAYER_SELECTORS = [
  "div.inline_player",
  "div#trackInfoInner",
  ".track_play_auxiliary",
  ".track_play_hilite",
  ".track_play_area",
];

export type BcPageType = "album" | "track";
