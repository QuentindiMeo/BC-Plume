import { toggleDurationDisplay } from "@/src/app/use-cases/toggle-duration-display";
import { TIME_DISPLAY_METHOD } from "@/src/domain/plume";
import { FakeAppCore } from "@/tests/fakes/FakeAppCore";
import { describe, expect, it } from "vitest";

describe("toggleDurationDisplay", () => {
  it("switches from DURATION to REMAINING", () => {
    const appCore = new FakeAppCore({ durationDisplayMethod: TIME_DISPLAY_METHOD.DURATION });
    toggleDurationDisplay(appCore);
    expect(appCore.getState().durationDisplayMethod).toBe(TIME_DISPLAY_METHOD.REMAINING);
  });

  it("switches from REMAINING to DURATION", () => {
    const appCore = new FakeAppCore({ durationDisplayMethod: TIME_DISPLAY_METHOD.REMAINING });
    toggleDurationDisplay(appCore);
    expect(appCore.getState().durationDisplayMethod).toBe(TIME_DISPLAY_METHOD.DURATION);
  });
});
