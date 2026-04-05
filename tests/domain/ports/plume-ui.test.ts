import { GUI_ACTIONS, guiActions } from "@/domain/ports/plume-ui";
import { describe, expect, it } from "vitest";

describe("guiActions.resetGuiInstance", () => {
  it("returns the correct action shape with null payload by default", () => {
    expect(guiActions.resetGuiInstance()).toEqual({
      type: GUI_ACTIONS.RESET_GUI_INSTANCE,
      payload: null,
    });
  });

  it("returns the correct action shape with provided reason", () => {
    const reason = "Test reset";
    expect(guiActions.resetGuiInstance(reason)).toEqual({
      type: GUI_ACTIONS.RESET_GUI_INSTANCE,
      payload: reason,
    });
  });

  it("returns the correct action shape with null payload when reason is explicitly null", () => {
    expect(guiActions.resetGuiInstance(null)).toEqual({
      type: GUI_ACTIONS.RESET_GUI_INSTANCE,
      payload: null,
    });
  });
});

describe("guiActions.setPlumeContainer", () => {
  it("returns the correct action shape with a div element", () => {
    const element = { tagName: "DIV" } as unknown as HTMLDivElement;
    expect(guiActions.setPlumeContainer(element)).toEqual({
      type: GUI_ACTIONS.SET_PLUME_CONTAINER,
      payload: element,
    });
  });

  it("returns the correct action shape with null payload", () => {
    expect(guiActions.setPlumeContainer(null)).toEqual({
      type: GUI_ACTIONS.SET_PLUME_CONTAINER,
      payload: null,
    });
  });
});

describe("guiActions.setHeaderLogo", () => {
  it("returns the correct action shape with an anchor element", () => {
    const element = { tagName: "A" } as unknown as HTMLAnchorElement;
    expect(guiActions.setHeaderLogo(element)).toEqual({
      type: GUI_ACTIONS.SET_HEADER_LOGO,
      payload: element,
    });
  });

  it("returns the correct action shape with null payload", () => {
    expect(guiActions.setHeaderLogo(null)).toEqual({
      type: GUI_ACTIONS.SET_HEADER_LOGO,
      payload: null,
    });
  });
});

describe("guiActions.setAudioElement", () => {
  it("returns the correct action shape with an audio element", () => {
    const element = { tagName: "AUDIO" } as unknown as HTMLAudioElement;
    expect(guiActions.setAudioElement(element)).toEqual({
      type: GUI_ACTIONS.SET_AUDIO_ELEMENT,
      payload: element,
    });
  });

  it("returns the correct action shape with null payload", () => {
    expect(guiActions.setAudioElement(null)).toEqual({
      type: GUI_ACTIONS.SET_AUDIO_ELEMENT,
      payload: null,
    });
  });
});

describe("guiActions.setTitleDisplay", () => {
  it("returns the correct action shape with a div element", () => {
    const element = { tagName: "DIV" } as unknown as HTMLDivElement;
    expect(guiActions.setTitleDisplay(element)).toEqual({
      type: GUI_ACTIONS.SET_TITLE_DISPLAY,
      payload: element,
    });
  });

  it("returns the correct action shape with null payload", () => {
    expect(guiActions.setTitleDisplay(null)).toEqual({
      type: GUI_ACTIONS.SET_TITLE_DISPLAY,
      payload: null,
    });
  });
});

describe("guiActions.setProgressSlider", () => {
  it("returns the correct action shape with an input element", () => {
    const element = { tagName: "INPUT", type: "range" } as unknown as HTMLInputElement;
    expect(guiActions.setProgressSlider(element)).toEqual({
      type: GUI_ACTIONS.SET_PROGRESS_SLIDER,
      payload: element,
    });
  });

  it("returns the correct action shape with null payload", () => {
    expect(guiActions.setProgressSlider(null)).toEqual({
      type: GUI_ACTIONS.SET_PROGRESS_SLIDER,
      payload: null,
    });
  });
});

describe("guiActions.setElapsedDisplay", () => {
  it("returns the correct action shape with a span element", () => {
    const element = { tagName: "SPAN" } as unknown as HTMLSpanElement;
    expect(guiActions.setElapsedDisplay(element)).toEqual({
      type: GUI_ACTIONS.SET_ELAPSED_DISPLAY,
      payload: element,
    });
  });

  it("returns the correct action shape with null payload", () => {
    expect(guiActions.setElapsedDisplay(null)).toEqual({
      type: GUI_ACTIONS.SET_ELAPSED_DISPLAY,
      payload: null,
    });
  });
});

describe("guiActions.setDurationDisplay", () => {
  it("returns the correct action shape with a button element", () => {
    const element = { tagName: "BUTTON" } as unknown as HTMLButtonElement;
    expect(guiActions.setDurationDisplay(element)).toEqual({
      type: GUI_ACTIONS.SET_DURATION_DISPLAY,
      payload: element,
    });
  });

  it("returns the correct action shape with null payload", () => {
    expect(guiActions.setDurationDisplay(null)).toEqual({
      type: GUI_ACTIONS.SET_DURATION_DISPLAY,
      payload: null,
    });
  });
});

describe("guiActions.setPlayPauseBtns", () => {
  it("returns the correct action shape with an array of button elements", () => {
    const buttons = [
      { tagName: "BUTTON" } as unknown as HTMLButtonElement,
      { tagName: "BUTTON" } as unknown as HTMLButtonElement,
    ];
    expect(guiActions.setPlayPauseBtns(buttons)).toEqual({
      type: GUI_ACTIONS.SET_PLAY_PAUSE_BTNS,
      payload: buttons,
    });
  });

  it("returns the correct action shape with an empty array", () => {
    expect(guiActions.setPlayPauseBtns([])).toEqual({
      type: GUI_ACTIONS.SET_PLAY_PAUSE_BTNS,
      payload: [],
    });
  });
});

describe("guiActions.setTrackFwdBtns", () => {
  it("returns the correct action shape with an array of button elements", () => {
    const buttons = [
      { tagName: "BUTTON" } as unknown as HTMLButtonElement,
      { tagName: "BUTTON" } as unknown as HTMLButtonElement,
    ];
    expect(guiActions.setTrackFwdBtns(buttons)).toEqual({
      type: GUI_ACTIONS.SET_TRACK_FWD_BTNS,
      payload: buttons,
    });
  });

  it("returns the correct action shape with an empty array", () => {
    expect(guiActions.setTrackFwdBtns([])).toEqual({
      type: GUI_ACTIONS.SET_TRACK_FWD_BTNS,
      payload: [],
    });
  });
});

describe("guiActions.setLoopBtns", () => {
  it("returns the correct action shape with an array of button elements", () => {
    const buttons = [
      { tagName: "BUTTON" } as unknown as HTMLButtonElement,
      { tagName: "BUTTON" } as unknown as HTMLButtonElement,
    ];
    expect(guiActions.setLoopBtns(buttons)).toEqual({
      type: GUI_ACTIONS.SET_LOOP_BTNS,
      payload: buttons,
    });
  });

  it("returns the correct action shape with an empty array", () => {
    expect(guiActions.setLoopBtns([])).toEqual({
      type: GUI_ACTIONS.SET_LOOP_BTNS,
      payload: [],
    });
  });
});

describe("guiActions.setVolumeSlider", () => {
  it("returns the correct action shape with an input element", () => {
    const element = { tagName: "INPUT", type: "range" } as unknown as HTMLInputElement;
    expect(guiActions.setVolumeSlider(element)).toEqual({
      type: GUI_ACTIONS.SET_VOLUME_SLIDER,
      payload: element,
    });
  });

  it("returns the correct action shape with null payload", () => {
    expect(guiActions.setVolumeSlider(null)).toEqual({
      type: GUI_ACTIONS.SET_VOLUME_SLIDER,
      payload: null,
    });
  });
});

describe("guiActions.setMuteBtn", () => {
  it("returns the correct action shape with a button element", () => {
    const element = { tagName: "BUTTON" } as unknown as HTMLButtonElement;
    expect(guiActions.setMuteBtn(element)).toEqual({
      type: GUI_ACTIONS.SET_MUTE_BTN,
      payload: element,
    });
  });

  it("returns the correct action shape with null payload", () => {
    expect(guiActions.setMuteBtn(null)).toEqual({
      type: GUI_ACTIONS.SET_MUTE_BTN,
      payload: null,
    });
  });
});

describe("guiActions.setFullscreenOverlay", () => {
  it("returns the correct action shape with a div element", () => {
    const element = { tagName: "DIV" } as unknown as HTMLDivElement;
    expect(guiActions.setFullscreenOverlay(element)).toEqual({
      type: GUI_ACTIONS.SET_FULLSCREEN_OVERLAY,
      payload: element,
    });
  });

  it("returns the correct action shape with null payload", () => {
    expect(guiActions.setFullscreenOverlay(null)).toEqual({
      type: GUI_ACTIONS.SET_FULLSCREEN_OVERLAY,
      payload: null,
    });
  });
});

describe("guiActions.setHiddenBcTable", () => {
  it("returns the correct action shape with a table element", () => {
    const element = { tagName: "TABLE" } as unknown as HTMLTableElement;
    expect(guiActions.setHiddenBcTable(element)).toEqual({
      type: GUI_ACTIONS.SET_HIDDEN_BC_TABLE,
      payload: element,
    });
  });

  it("returns the correct action shape with null payload", () => {
    expect(guiActions.setHiddenBcTable(null)).toEqual({
      type: GUI_ACTIONS.SET_HIDDEN_BC_TABLE,
      payload: null,
    });
  });
});
