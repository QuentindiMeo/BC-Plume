import { GUI_ACTIONS, guiActions } from "@/domain/ports/plume-ui";
import { describe, expect, it } from "vitest";

describe("guiActions.resetGuiInstance", () => {
  it("returns the correct action shape with null payload by default", () => {
    expect(guiActions.resetGuiInstance()).toEqual({
      type: GUI_ACTIONS.RESET_GUI_INSTANCE,
      payload: null,
    });
  });
});
