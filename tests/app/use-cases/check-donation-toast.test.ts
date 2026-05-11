import { describe, expect, it, vi } from "vitest";

import { getDonationPlayCount, shouldShowDonationToast } from "@/app/use-cases/check-donation-toast";
import { PLUME_CACHE_KEYS } from "@/domain/browser";
import type { IBrowserCache } from "@/domain/ports/browser";

const makePlayCountCache = (playCount: number | undefined): IBrowserCache => ({
  get: vi.fn().mockResolvedValue({ [PLUME_CACHE_KEYS.FULL_PLAY_COUNT]: playCount }),
  set: vi.fn(),
  remove: vi.fn(),
});

describe("shouldShowDonationToast", () => {
  it("returns false at 0 (below all thresholds)", () => {
    expect(shouldShowDonationToast(0)).toBe(false);
  });

  it("returns false at 59 (just below first threshold)", () => {
    expect(shouldShowDonationToast(59)).toBe(false);
  });

  it("returns true at 60 (first threshold)", () => {
    expect(shouldShowDonationToast(60)).toBe(true);
  });

  it("returns false at 61 (just above first threshold)", () => {
    expect(shouldShowDonationToast(61)).toBe(false);
  });

  it("returns false at 249", () => {
    expect(shouldShowDonationToast(249)).toBe(false);
  });

  it("returns true at 250 (second threshold)", () => {
    expect(shouldShowDonationToast(250)).toBe(true);
  });

  it("returns false at 251", () => {
    expect(shouldShowDonationToast(251)).toBe(false);
  });

  it("returns false at 1999 (just below third threshold)", () => {
    expect(shouldShowDonationToast(1999)).toBe(false);
  });

  it("returns true at 2000 (third threshold)", () => {
    expect(shouldShowDonationToast(2000)).toBe(true);
  });

  it("returns false at 2001 (just above third threshold)", () => {
    expect(shouldShowDonationToast(2001)).toBe(false);
  });

  it("returns false at 4999 (just below fourth threshold)", () => {
    expect(shouldShowDonationToast(4999)).toBe(false);
  });

  it("returns true at 5000 (fourth threshold)", () => {
    expect(shouldShowDonationToast(5000)).toBe(true);
  });

  it("returns false at 5001 (just above fourth threshold)", () => {
    expect(shouldShowDonationToast(5001)).toBe(false);
  });

  it("returns true at 9000 (fifth threshold)", () => {
    expect(shouldShowDonationToast(9000)).toBe(true);
  });

  it("returns false at 44001 (just above last threshold)", () => {
    expect(shouldShowDonationToast(44001)).toBe(false);
  });

  it("returns false at 54000 (well beyond last threshold)", () => {
    expect(shouldShowDonationToast(54000)).toBe(false);
  });
});

describe("getDonationPlayCount", () => {
  it("returns 0 when cache key is absent", async () => {
    expect(await getDonationPlayCount(makePlayCountCache(undefined))).toBe(0);
  });

  it("returns stored count when present", async () => {
    expect(await getDonationPlayCount(makePlayCountCache(42))).toBe(42);
  });
});
