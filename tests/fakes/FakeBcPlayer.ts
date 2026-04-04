import type { BcPageType, BcPlayerPort } from "@/domain/ports/bc-player";

/**
 * Minimal BcPlayerPort stub for tests. Only implements the three methods that updateTrackMetadata calls;
 * all others are left unimplemented.
 */
export class FakeBcPlayer
  implements Pick<BcPlayerPort, "getTrackTitle" | "getTrackRows" | "getTrackPlayabilityMap" | "getTrackRowTitles">
{
  constructor(private readonly trackTitle: string | null = "Some Track") {}

  getTrackTitle(_pageType: BcPageType): string | null {
    return this.trackTitle;
  }

  getTrackRows(): HTMLTableRowElement[] {
    return [];
  }

  getTrackPlayabilityMap(): boolean[] {
    return [];
  }

  getTrackRowTitles(): string[] {
    return [];
  }
}

export const fakeBcPlayer = (trackTitle: string | null = "Some Track"): BcPlayerPort =>
  new FakeBcPlayer(trackTitle) as unknown as BcPlayerPort;
