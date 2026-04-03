import { navigateToTrack } from "@/app/use-cases/navigate-to-track";
import type { BcPlayerPort } from "@/domain/ports/bc-player";
import { describe, expect, it, vi } from "vitest";

const makeRow = (playable: boolean) =>
  ({
    classList: { contains: (c: string) => c === "linked" && playable },
    click: vi.fn(),
  }) as unknown as HTMLTableRowElement;

const makeBcPlayer = (rows: HTMLTableRowElement[]): BcPlayerPort =>
  ({ getTrackRows: () => rows }) as unknown as BcPlayerPort;

describe("navigateToTrack", () => {
  it("clicks the row when the index is valid and the track is playable", () => {
    const row = makeRow(true);
    navigateToTrack(0, makeBcPlayer([row]));
    expect(row.click).toHaveBeenCalledOnce();
  });

  it("clicks the correct row by index when multiple rows exist", () => {
    const rows = [makeRow(true), makeRow(true), makeRow(true)];
    navigateToTrack(1, makeBcPlayer(rows));
    expect(rows[0].click).not.toHaveBeenCalled();
    expect(rows[1].click).toHaveBeenCalledOnce();
    expect(rows[2].click).not.toHaveBeenCalled();
  });

  it("does not click when the index is negative", () => {
    const row = makeRow(true);
    navigateToTrack(-1, makeBcPlayer([row]));
    expect(row.click).not.toHaveBeenCalled();
  });

  it("does not click when the index equals the row count", () => {
    const row = makeRow(true);
    navigateToTrack(1, makeBcPlayer([row]));
    expect(row.click).not.toHaveBeenCalled();
  });

  it("does not click when the track is unplayable (no linked class)", () => {
    const row = makeRow(false);
    navigateToTrack(0, makeBcPlayer([row]));
    expect(row.click).not.toHaveBeenCalled();
  });

  it("does not throw when the rows array is empty", () => {
    expect(() => navigateToTrack(0, makeBcPlayer([]))).not.toThrow();
  });
});
