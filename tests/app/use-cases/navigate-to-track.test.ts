import { navigateToTrack } from "@/app/use-cases/navigate-to-track";
import type { BcPlayerPort } from "@/domain/ports/bc-player";
import { describe, expect, it, vi } from "vitest";

const makeBtn = () => ({ click: vi.fn() });
const makeRow = (playable: boolean) =>
  ({
    classList: { contains: (c: string) => c === "linked" && playable },
  }) as HTMLTableRowElement;

const makeBcPlayer = (
  rows: HTMLTableRowElement[],
  titles: string[],
  currentTitle: string | null,
  prevBtn = makeBtn(),
  nextBtn = makeBtn()
): BcPlayerPort =>
  ({
    getTrackTitle: (_pageType: string) => currentTitle,
    getTrackRows: () => rows,
    getTrackRowTitles: () => titles,
    getPreviousTrackButton: () => prevBtn,
    getNextTrackButton: () => nextBtn,
  }) as unknown as BcPlayerPort;

describe("navigateToTrack", () => {
  it("clicks next once when the target is one ahead of the current track", () => {
    const next = makeBtn();
    const rows = [makeRow(true), makeRow(true), makeRow(true)];
    navigateToTrack(1, makeBcPlayer(rows, ["A", "B", "C"], "A", makeBtn(), next));
    expect(next.click).toHaveBeenCalledOnce();
  });

  it("clicks next N times for a forward jump of N", () => {
    const next = makeBtn();
    const rows = [makeRow(true), makeRow(true), makeRow(true), makeRow(true)];
    navigateToTrack(3, makeBcPlayer(rows, ["A", "B", "C", "D"], "A", makeBtn(), next));
    expect(next.click).toHaveBeenCalledTimes(3);
  });

  it("clicks prev once when the target is one behind the current track", () => {
    const prev = makeBtn();
    const rows = [makeRow(true), makeRow(true), makeRow(true)];
    navigateToTrack(0, makeBcPlayer(rows, ["A", "B", "C"], "B", prev, makeBtn()));
    expect(prev.click).toHaveBeenCalledOnce();
  });

  it("clicks prev N times for a backward jump of N", () => {
    const prev = makeBtn();
    const rows = [makeRow(true), makeRow(true), makeRow(true), makeRow(true)];
    navigateToTrack(0, makeBcPlayer(rows, ["A", "B", "C", "D"], "C", prev, makeBtn()));
    expect(prev.click).toHaveBeenCalledTimes(2);
  });

  it("does nothing when the target is already the current track", () => {
    const prev = makeBtn();
    const next = makeBtn();
    const rows = [makeRow(true), makeRow(true)];
    navigateToTrack(1, makeBcPlayer(rows, ["A", "B"], "B", prev, next));
    expect(prev.click).not.toHaveBeenCalled();
    expect(next.click).not.toHaveBeenCalled();
  });

  it("uses prev-then-next fallback when the current track is unknown", () => {
    const prev = makeBtn();
    const next = makeBtn();
    const rows = [makeRow(true), makeRow(true), makeRow(true)];
    navigateToTrack(2, makeBcPlayer(rows, ["A", "B", "C"], null, prev, next));
    expect(prev.click).toHaveBeenCalledTimes(3); // rows.length to reach start
    expect(next.click).toHaveBeenCalledTimes(2); // trackIndex steps forward
  });

  it("does not navigate when the index is negative", () => {
    const prev = makeBtn();
    const next = makeBtn();
    navigateToTrack(-1, makeBcPlayer([makeRow(true)], ["A"], "A", prev, next));
    expect(prev.click).not.toHaveBeenCalled();
    expect(next.click).not.toHaveBeenCalled();
  });

  it("does not navigate when the index equals the row count", () => {
    const prev = makeBtn();
    const next = makeBtn();
    navigateToTrack(1, makeBcPlayer([makeRow(true)], ["A"], "A", prev, next));
    expect(prev.click).not.toHaveBeenCalled();
    expect(next.click).not.toHaveBeenCalled();
  });

  it("does not navigate when the track is unplayable", () => {
    const prev = makeBtn();
    const next = makeBtn();
    navigateToTrack(0, makeBcPlayer([makeRow(false)], ["A"], null, prev, next));
    expect(prev.click).not.toHaveBeenCalled();
    expect(next.click).not.toHaveBeenCalled();
  });

  it("does not throw when the rows array is empty", () => {
    expect(() => navigateToTrack(0, makeBcPlayer([], [], null))).not.toThrow();
  });
});
