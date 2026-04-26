export interface TrackAudioInfo {
  trackNumber: number;
  trackUrl: string;
  audioStreamUrl: string;
}

/**
 * Port for extracting track audio metadata from the current Bandcamp page
 * and persisting/retrieving cached BPM values.
 */
export interface TrackAudioPort {
  /** Parses the page to extract audio stream URLs for all playable tracks. */
  getTrackAudioInfos(): TrackAudioInfo[];

  /** Retrieves a previously cached BPM for the given track URL, or null if none exists. */
  getCachedBpm(trackUrl: string): Promise<number | null>;

  /** Persists a BPM value for the given track URL. */
  setCachedBpm(trackUrl: string, bpm: number): Promise<void>;

  /** Retrieves all cached BPMs for a set of track URLs in a single batch. */
  getCachedBpms(trackUrls: string[]): Promise<Map<string, number>>;
}
