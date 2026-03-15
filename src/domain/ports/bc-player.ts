export type BcPageType = "album" | "track";

export interface BcPlayerPort {
  isPlayerPresent(): boolean;

  // Track data — plain values, no DOM leakage
  getTrackTitle(pageType: BcPageType): string | null;
  getAlbumContext(): string | null;
  getArtworkUrl(): string | null;
  getTrackDuration(): number | null;
  isPlaying(): boolean;
  getCurrentTime(): number;
  getVolume(): number;

  // Track list data — data-centric access to album track table
  getTrackRows(): HTMLTableRowElement[];
  getTrackRowTitles(): string[];
  getTrackRowDurations(): (string | null)[];

  // Element references for event wiring or imperative control
  getAudioElement(): HTMLAudioElement | null;
  getPageBackground(): HTMLElement | null;
  getPlayerParent(): HTMLElement | null;
  getInfoSection(): HTMLElement | null;
  getTrackTitleElement(): HTMLElement | null;
  getTrackView(): HTMLDivElement | null;
  getInlinePlayerTable(): HTMLTableElement | null;
  getPlayPauseButton(): HTMLButtonElement | null;
  getPreviousTrackButton(): HTMLButtonElement | null;
  getNextTrackButton(): HTMLButtonElement | null;
}
