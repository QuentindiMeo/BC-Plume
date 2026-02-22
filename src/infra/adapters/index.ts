import type { BcPlayerPort } from "../../domain/ports/bc-player";
import type { MusicPlayerPort } from "../../domain/ports/music-player";
import { BcPlayerAdapter } from "./bc-player";
import { MusicPlayerAdapter } from "./music-player";

export const bandcampPlayer: BcPlayerPort = new BcPlayerAdapter();
export const musicPlayer: MusicPlayerPort = new MusicPlayerAdapter();
