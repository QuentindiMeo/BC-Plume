import type { BcPlayerPort } from "../../domain/ports/bc-player";
import { BcPlayerAdapter } from "./bc-player";

export const bandcampPlayer: BcPlayerPort = new BcPlayerAdapter();
