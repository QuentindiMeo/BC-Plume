export enum TIME_DISPLAY_METHOD {
  DURATION = "duration",
  REMAINING = "remaining",
}
export type TimeDisplayMethodType = `${TIME_DISPLAY_METHOD}`;

export const BC_PLAYER_SELECTORS = [
  "div.inline_player",
  "div#trackInfoInner",
  ".track_play_auxiliary",
  ".track_play_hilite",
  ".track_play_area",
];

export type BcPageType = "album" | "track";
