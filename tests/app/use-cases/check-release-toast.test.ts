import { APP_VERSION } from "@/domain/meta";
import { PLUME_CACHE_KEYS } from "@/domain/browser";
import type { IBrowserCache } from "@/domain/ports/browser";
import { shouldShowReleaseToast } from "@/app/use-cases/check-release-toast";
import { describe, it, expect, vi } from "vitest";

const makeCache = (storedVersion: string | undefined): IBrowserCache => ({
  get: vi.fn().mockResolvedValue({ [PLUME_CACHE_KEYS.LAST_SEEN_RELEASE]: storedVersion }),
  set: vi.fn(),
  remove: vi.fn(),
});

describe("shouldShowReleaseToast", () => {
  it("returns false when stored version matches current version", async () => {
    expect(await shouldShowReleaseToast(makeCache(APP_VERSION))).toBe(false);
  });

  it("returns true when stored version differs from current version", async () => {
    expect(await shouldShowReleaseToast(makeCache("v0.0.0"))).toBe(true);
  });

  it("returns true when key is absent in cache", async () => {
    expect(await shouldShowReleaseToast(makeCache(undefined))).toBe(true);
  });
});
