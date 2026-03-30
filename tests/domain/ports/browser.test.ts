import { PLUME_CACHE_KEYS } from "@/domain/browser";
import { BROWSER_ACTIONS, browserActions } from "@/domain/ports/browser";
import { describe, expect, it } from "vitest";

describe("browserActions.setCacheValues", () => {
  it("returns the correct action shape", () => {
    expect(browserActions.setCacheValues([PLUME_CACHE_KEYS.VOLUME], [80])).toEqual({
      type: BROWSER_ACTIONS.SET_CACHE_VALUES,
      payload: { keys: [PLUME_CACHE_KEYS.VOLUME], values: [80] },
    });
  });
});
