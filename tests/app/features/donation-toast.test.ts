import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkAndShowDonationToast } from "@/app/features/donation-toast";
import { PLUME_CACHE_KEYS } from "@/domain/browser";
import { PLUME_CONSTANTS } from "@/domain/plume";
import type { IBrowserCache } from "@/domain/ports/browser";

const mockCreateToast = vi.fn();
vi.mock("@/app/features/ui/toast", () => ({ createToast: (...args: unknown[]) => mockCreateToast(...args) }));

const mockDispatch = vi.fn();
vi.mock("@/app/stores/BrowserImpl", () => ({ getBrowserInstance: () => ({ dispatch: mockDispatch }) }));

vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/shared/logger", () => ({ CPL: { DEBUG: "debug" }, logger: vi.fn() }));

const makeCache = (playCount: number): IBrowserCache => ({
  get: vi.fn().mockResolvedValue({ [PLUME_CACHE_KEYS.FULL_PLAY_COUNT]: playCount }),
  set: vi.fn(),
  remove: vi.fn(),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkAndShowDonationToast", () => {
  const oneOffFirstThreshold = PLUME_CONSTANTS.DONATION_THRESHOLDS[0] - 1;
  const oneOffSecondThreshold = PLUME_CONSTANTS.DONATION_THRESHOLDS[1] - 1;

  describe("play count persistence", () => {
    it("increments and persists the play count regardless of threshold", async () => {
      await checkAndShowDonationToast(makeCache(10)); // newPlayCount = 11, no threshold hit
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ keys: [PLUME_CACHE_KEYS.FULL_PLAY_COUNT], values: [11] }),
        })
      );
    });
  });

  describe("threshold guard", () => {
    it("does not show the toast when the new play count misses all thresholds", async () => {
      await checkAndShowDonationToast(makeCache(0));
      expect(mockCreateToast).not.toHaveBeenCalled();
    });

    it("does not show the toast one play before the first threshold", async () => {
      await checkAndShowDonationToast(makeCache(oneOffFirstThreshold - 1));
      expect(mockCreateToast).not.toHaveBeenCalled();
    });

    it("does not show the toast one play after the first threshold", async () => {
      await checkAndShowDonationToast(makeCache(PLUME_CONSTANTS.DONATION_THRESHOLDS[0]));
      expect(mockCreateToast).not.toHaveBeenCalled();
    });
  });

  describe("toast display", () => {
    it("shows the toast when the new play count hits the first threshold", async () => {
      await checkAndShowDonationToast(makeCache(oneOffFirstThreshold));
      expect(mockCreateToast).toHaveBeenCalledOnce();
    });

    it("shows the toast when the new play count hits the second threshold", async () => {
      await checkAndShowDonationToast(makeCache(oneOffSecondThreshold));
      expect(mockCreateToast).toHaveBeenCalledOnce();
    });
  });
});
