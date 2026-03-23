import type { BcPageType, BcPlayerPort } from "../../domain/ports/bc-player";
import { BC_ELEM_SELECTORS, BC_PLAYER_SELECTORS } from "../elements/bandcamp";

export class BcPlayerAdapter implements BcPlayerPort {
  private query<T extends Element>(selector: string): T | null {
    return document.querySelector<T>(selector);
  }

  isPlayerPresent(): boolean {
    for (const selector of BC_PLAYER_SELECTORS) if (document.querySelector(selector)) return true;
    return false;
  }

  // Album and track pages expose the current track title under different elements.
  getTrackTitle(pageType: BcPageType): string | null {
    const selector =
      pageType === "album" ? BC_ELEM_SELECTORS.albumPageCurrentTrackTitle : BC_ELEM_SELECTORS.songPageCurrentTrackTitle;

    const el = this.query<HTMLElement>(selector);
    const text = el?.textContent?.trim();
    return text ?? null;
  }

  getAlbumContext(): string | null {
    const el = this.query<HTMLElement>(BC_ELEM_SELECTORS.fromAlbum);
    const text = el?.textContent?.trim();
    return text ?? null;
  }

  getArtworkUrl(): string | null {
    const img = this.query<HTMLImageElement>(BC_ELEM_SELECTORS.coverArt);
    if (!img?.src) return null;
    // Bandcamp suffixes: _2 = 350px, _5 = 700px. Upgrade for fullscreen use.
    return img.src.replace(/_\d+\.jpg$/, "_5.jpg");
  }

  getTrackDuration(): number | null {
    const audio = this.query<HTMLAudioElement>(BC_ELEM_SELECTORS.audioPlayer);
    if (!audio) return null;

    const { duration } = audio;
    if (Number.isNaN(duration) || !Number.isFinite(duration)) return null;

    return duration;
  }

  isPlaying(): boolean {
    const audio = this.query<HTMLAudioElement>(BC_ELEM_SELECTORS.audioPlayer);
    return audio ? !audio.paused : false;
  }

  getCurrentTime(): number {
    const audio = this.query<HTMLAudioElement>(BC_ELEM_SELECTORS.audioPlayer);
    return audio?.currentTime ?? 0;
  }

  getVolume(): number {
    const audio = this.query<HTMLAudioElement>(BC_ELEM_SELECTORS.audioPlayer);
    return audio?.volume ?? 0;
  }

  getTrackRows(): HTMLTableRowElement[] {
    const trackList = this.query<HTMLTableElement>(BC_ELEM_SELECTORS.trackList);
    if (!trackList) return [];
    return Array.from(trackList.querySelectorAll<HTMLTableRowElement>(BC_ELEM_SELECTORS.trackRow));
  }

  getTrackRowTitles(): string[] {
    const trackList = this.query<HTMLTableElement>(BC_ELEM_SELECTORS.trackList);
    if (!trackList) return [];
    return Array.from(trackList.querySelectorAll<HTMLSpanElement>(BC_ELEM_SELECTORS.trackTitle)).map(
      (el) => el.textContent?.trim() ?? ""
    );
  }

  getTrackRowDurations(): (string | null)[] {
    const trackList = this.query<HTMLTableElement>(BC_ELEM_SELECTORS.trackList);
    if (!trackList) return [];
    return Array.from(trackList.querySelectorAll<HTMLTableRowElement>(BC_ELEM_SELECTORS.trackRow)).map((row) => {
      const cell = row.querySelector<HTMLSpanElement>(BC_ELEM_SELECTORS.trackDuration);
      return cell?.textContent?.trim() ?? null;
    });
  }

  getAudioElement(): HTMLAudioElement | null {
    return this.query<HTMLAudioElement>(BC_ELEM_SELECTORS.audioPlayer);
  }

  getPageBackground(): HTMLElement | null {
    return this.query<HTMLElement>(BC_ELEM_SELECTORS.pageBackground);
  }

  getPlayerParent(): HTMLElement | null {
    return this.query<HTMLElement>(BC_ELEM_SELECTORS.playerParent);
  }

  getInfoSection(): HTMLElement | null {
    return this.query<HTMLElement>(BC_ELEM_SELECTORS.infoSection);
  }

  getTrackTitleElement(): HTMLElement | null {
    return this.query<HTMLElement>(BC_ELEM_SELECTORS.songPageCurrentTrackTitle);
  }

  getTrackView(): HTMLDivElement | null {
    return this.query<HTMLDivElement>(BC_ELEM_SELECTORS.trackView);
  }

  getInlinePlayerTable(): HTMLTableElement | null {
    return this.query<HTMLTableElement>(BC_ELEM_SELECTORS.inlinePlayerTable);
  }

  getPlayPauseButton(): HTMLButtonElement | null {
    return this.query<HTMLButtonElement>(BC_ELEM_SELECTORS.playPause);
  }

  getPreviousTrackButton(): HTMLButtonElement | null {
    return this.query<HTMLButtonElement>(BC_ELEM_SELECTORS.previousTrack);
  }

  getNextTrackButton(): HTMLButtonElement | null {
    return this.query<HTMLButtonElement>(BC_ELEM_SELECTORS.nextTrack);
  }
}
