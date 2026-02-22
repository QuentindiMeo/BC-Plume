import type { BcPlayerPort } from "../../domain/ports/bc-player";
import type { MusicPlayerPort } from "../../domain/ports/music-player";

// Populated once at the composition root (main.ts) before launchPlume() runs.
// All app-layer features read through these accessors rather than importing infra singletons directly.
let bcPlayerInstance: BcPlayerPort | null = null;
let musicPlayerInstance: MusicPlayerPort | null = null;

export const registerBcPlayer = (instance: BcPlayerPort): void => {
  bcPlayerInstance = instance;
};

export const registerMusicPlayer = (instance: MusicPlayerPort): void => {
  musicPlayerInstance = instance;
};

export const getBcPlayerInstance = (): BcPlayerPort => {
  if (!bcPlayerInstance) throw new Error("BcPlayerPort not registered — call registerBcPlayer() first.");
  return bcPlayerInstance;
};

export const getMusicPlayerInstance = (): MusicPlayerPort => {
  if (!musicPlayerInstance) throw new Error("MusicPlayerPort not registered — call registerMusicPlayer() first.");
  return musicPlayerInstance;
};
