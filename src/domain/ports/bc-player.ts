export type BcPageType = "album" | "track";

export interface BcPlayerPort {
  isPlayerPresent(): boolean;

  getCurrentTrackUrl(): string | null;
  getTrackTitle(pageType: BcPageType): string | null; // Track data — plain values, no DOM leakage
  getArtworkUrl(): string | null;
  getTrackDuration(): number | null;
  isPlaying(): boolean;
  getCurrentTime(): number;
  getVolume(): number;

  // Track list data — data-centric access to album track table
  getTrackRows(): HTMLTableRowElement[];
  getTrackPlayabilityMap(): boolean[];
  getTrackRowTitles(): string[];
  getTrackRowDurations(): (string | null)[];

  // Element references for event wiring or imperative control
  getAudioElement(): HTMLAudioElement | null;
  getPageBackground(): HTMLElement | null;
  getPlayerParent(): HTMLElement | null;
  getInfoSection(): HTMLDivElement | null;
  getTrackTitleElement(): HTMLElement | null;
  getTrackView(): HTMLDivElement | null;
  getInlinePlayerTable(): HTMLTableElement | null;
  getPlayPauseButton(): HTMLButtonElement | null;
  getPreviousTrackButton(): HTMLButtonElement | null;
  getNextTrackButton(): HTMLButtonElement | null;
}
