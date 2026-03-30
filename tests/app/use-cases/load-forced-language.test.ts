import { loadForcedLanguage } from "@/app/use-cases/load-forced-language";
import { PLUME_CACHE_KEYS } from "@/domain/browser";
import { PLUME_SUPPORTED_LANGUAGES, type PlumeLanguage } from "@/domain/plume";
import { inferBrowserApi } from "@/shared/browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeBrowserLocalStorage } from "../../fakes/FakeBrowserLocalStorage";

vi.mock("@/shared/browser", () => ({ inferBrowserApi: vi.fn() }));

let fakeStorage: FakeBrowserLocalStorage;

beforeEach(() => {
  fakeStorage = new FakeBrowserLocalStorage();
  vi.mocked(inferBrowserApi).mockReturnValue({
    storage: { local: fakeStorage },
  } as unknown as ReturnType<typeof inferBrowserApi>);
});

describe("loadForcedLanguage", () => {
  it("returns undefined when key is absent", async () => {
    expect(await loadForcedLanguage()).toBeUndefined();
  });

  it.each(PLUME_SUPPORTED_LANGUAGES)("accepts valid language code '%s'", async (lang: PlumeLanguage) => {
    fakeStorage.store[PLUME_CACHE_KEYS.FORCED_LANGUAGE] = lang;
    expect(await loadForcedLanguage()).toBe(lang);
  });

  it("returns undefined for an unrecognized language code", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.FORCED_LANGUAGE] = "de";
    expect(await loadForcedLanguage()).toBeUndefined();
  });

  it("returns undefined for a non-string value", async () => {
    fakeStorage.store[PLUME_CACHE_KEYS.FORCED_LANGUAGE] = 42;
    expect(await loadForcedLanguage()).toBeUndefined();
  });
});
