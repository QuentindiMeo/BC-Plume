// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  handleSpeedSlider,
  handleSpeedSliderKeydown,
  setupSpeedLabelClickBehavior,
  setupSpeedPopoverBehavior,
} from "@/app/features/ui/playback";
import { PLUME_ELEM_SELECTORS } from "@/infra/elements/plume";
import { FakeAppCore } from "../../fakes/FakeAppCore";
import { FakeMusicPlayer } from "../../fakes/FakeMusicPlayer";

const fakeToast = vi.fn();
vi.mock("@/app/features/ui/toast", () => ({ createToast: (...args: unknown[]) => fakeToast(...args) }));

let fakeAppCore = new FakeAppCore();
let fakeMusicPlayer = new FakeMusicPlayer();

vi.mock("@/app/stores/AppCoreImpl", () => ({ getAppCoreInstance: () => fakeAppCore }));
vi.mock("@/app/stores/adapters", () => ({
  getMusicPlayerInstance: () => fakeMusicPlayer,
  getBcPlayerInstance: vi.fn(),
}));
vi.mock("@/app/use-cases", () => ({
  cyclePlaybackSpeed: vi.fn(),
  navigateTrackBackward: vi.fn(),
  navigateTrackForward: vi.fn(),
  seekBackward: vi.fn(),
  seekForward: vi.fn(),
  togglePlayback: vi.fn(),
}));

const mockGetState = vi.fn(() => ({}));
vi.mock("@/app/stores/GuiImpl", () => ({
  getGuiInstance: () => ({
    getState: mockGetState,
  }),
}));

vi.mock("@/app/features/fullscreen", () => ({ cleanupFullscreenMode: vi.fn() }));
vi.mock("@/app/features/observers", () => ({ updateTrackForwardBtnState: vi.fn() }));
vi.mock("@/app/features/ui/loop", () => ({ syncLoopBtn: vi.fn() }));
vi.mock("@/app/features/ui/volume", () => ({ syncMuteBtn: vi.fn() }));
vi.mock("@/infra/elements/plume", () => ({
  PLUME_ELEM_SELECTORS: {
    speedBtn: "button#plume-speed-btn",
    speedLabel: "span.plume-speed-label",
    speedSlider: "input.plume-speed-slider",
    speedCustomInput: "input.plume-speed-custom-input",
    speedPopover: "div.plume-speed-popover",
    tracklistToggleBtn: "button#plume-tracklist-toggle-btn",
    tracklistDropdown: "div#plume-tracklist-dropdown",
    fullscreenBtnContainer: "div#plume-fullscreen-btn-container",
    headerTrackLink: "a#plume-header-track-link",
  },
}));
vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/shared/logger", () => ({ CPL: {}, logger: vi.fn() }));
vi.mock("@/shared/presenters", () => ({ presentFormattedTime: () => "0:00" }));
vi.mock("@/shared/svg", () => ({ setSvgContent: vi.fn() }));
vi.mock("@/svg/icons", () => ({ PLUME_SVG: {} }));

const makeSpeedWrapper = (): HTMLDivElement => {
  const wrapper = document.createElement("div");
  const btn = document.createElement("button");
  btn.id = PLUME_ELEM_SELECTORS.speedBtn.split("#")[1];
  const popover = document.createElement("div");
  popover.className = PLUME_ELEM_SELECTORS.speedPopover.split(".")[1];
  const label = document.createElement("span");
  label.className = PLUME_ELEM_SELECTORS.speedLabel.split(".")[1];
  label.textContent = "1×";
  const customInput = document.createElement("input");
  customInput.type = "text";
  customInput.className = PLUME_ELEM_SELECTORS.speedCustomInput.split(".")[1];
  customInput.hidden = true;
  const slider = document.createElement("input");
  slider.type = "range";
  slider.className = PLUME_ELEM_SELECTORS.speedSlider.split(".")[1];
  slider.min = "0";
  slider.max = "8";
  slider.step = "1";
  slider.value = "3"; // index of 1× in PLAYBACK_SPEED_STEPS
  popover.appendChild(label);
  popover.appendChild(customInput);
  popover.appendChild(slider);
  wrapper.appendChild(btn);
  wrapper.appendChild(popover);
  return wrapper;
};

const speedLabel = (wrapper: HTMLDivElement) =>
  wrapper.querySelector<HTMLElement>("." + PLUME_ELEM_SELECTORS.speedLabel.split(".")[1]);
const speedSlider = (wrapper: HTMLDivElement) =>
  wrapper.querySelector<HTMLInputElement>("." + PLUME_ELEM_SELECTORS.speedSlider.split(".")[1]);
const speedCustomInput = (wrapper: HTMLDivElement) =>
  wrapper.querySelector<HTMLInputElement>("." + PLUME_ELEM_SELECTORS.speedCustomInput.split(".")[1]);
const speedBtn = (wrapper: HTMLDivElement) =>
  wrapper.querySelector<HTMLButtonElement>("#" + PLUME_ELEM_SELECTORS.speedBtn.split("#")[1]);

// Build a minimal plume GUI state with a speed wrapper
const makeGuiState = (speedBtns: HTMLDivElement[]) => ({
  speedBtns,
  loopBtns: [],
  playPauseBtns: [],
  trackFwdBtns: [],
  volumeSlider: { value: "100", setAttribute: vi.fn(), parentElement: null } as unknown as HTMLInputElement,
});

describe("playbackSpeed store subscription", () => {
  let cleanup: () => void;
  let speedWrapper: HTMLDivElement;

  beforeEach(async () => {
    vi.resetModules();
    fakeAppCore = new FakeAppCore();
    fakeMusicPlayer = new FakeMusicPlayer();
    speedWrapper = makeSpeedWrapper();
    mockGetState.mockReturnValue(makeGuiState([speedWrapper]));
    fakeToast.mockReset();

    const { setupStoreSubscriptions } = await import("@/app/features/store-subscriptions");
    cleanup = setupStoreSubscriptions();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("calls setPlaybackRate on the music player when speed changes", () => {
    fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 1.5 as never });
    expect(fakeMusicPlayer.playbackRate).toBe(1.5);
  });

  it("updates the label text when speed changes", () => {
    fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 2 as never });
    expect(speedLabel(speedWrapper)?.textContent).toBe("2×");
  });

  it("updates the slider value when speed changes", () => {
    fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 2 as never });
    expect(speedSlider(speedWrapper)?.value).toBe("6"); // index of 2 in PLAYBACK_SPEED_STEPS
  });

  it("updates all wrappers when multiple exist", () => {
    const wrapper2 = makeSpeedWrapper();
    mockGetState.mockReturnValue(makeGuiState([speedWrapper, wrapper2]));

    fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 0.5 as never });

    expect(speedLabel(speedWrapper)?.textContent).toBe("0.5×");
    expect(speedLabel(wrapper2)?.textContent).toBe("0.5×");
    expect(speedSlider(speedWrapper)?.value).toBe("1"); // index of 0.5
    expect(speedSlider(wrapper2)?.value).toBe("1");
  });

  it("interpolates the slider position between the two closest ticks for a custom value", () => {
    // 1.3 is between PLAYBACK_SPEED_STEPS[4]=1.25 and PLAYBACK_SPEED_STEPS[5]=1.5
    // t = (1.3 - 1.25) / (1.5 - 1.25) = 0.2  →  4 + 0.2 = 4.2
    const slider = speedSlider(speedWrapper)!;
    fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 1.3 as never });
    expect(parseFloat(slider.value)).toBeCloseTo(4.2, 5);
    expect(slider.getAttribute("aria-valuetext")).toBe("1.3×");
  });

  it("updates the speed button aria-label with the current speed", () => {
    fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 1.5 as never });
    expect(speedBtn(speedWrapper)?.ariaLabel).toBe("ARIA__SPEED_BTN");
  });

  it("closes the custom input and restores the label when speed changes externally", () => {
    const input = speedCustomInput(speedWrapper)!;
    const label = speedLabel(speedWrapper)!;
    input.hidden = false;
    label.hidden = true;

    fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 1.5 as never });

    expect(input.hidden).toBe(true);
    expect(label.hidden).toBe(false);
  });

  describe("Safari speed warning toast", () => {
    beforeEach(() => {
      vi.stubGlobal("navigator", { vendor: "Apple Computer, Inc." });
    });

    it("shows the toast when speed drops below 0.5 on Safari", () => {
      fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 0.25 as never });
      expect(fakeToast).toHaveBeenCalledOnce();
    });

    it("shows the toast when speed exceeds 2 on Safari", () => {
      fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 3 as never });
      expect(fakeToast).toHaveBeenCalledOnce();
    });

    it("does not show the toast for a speed within Safari's supported range", () => {
      fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 1.5 as never });
      expect(fakeToast).not.toHaveBeenCalled();
    });

    it("does not show the toast a second time on the same session", () => {
      fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 0.25 as never });
      fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 3 as never });
      expect(fakeToast).toHaveBeenCalledOnce();
    });
  });

  describe("Safari speed warning toast — non-Safari", () => {
    beforeEach(() => {
      vi.stubGlobal("navigator", { vendor: "Google Inc." });
    });

    it("does not show the toast on Chrome even for an out-of-Safari-range speed", () => {
      fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 0.25 as never });
      expect(fakeToast).not.toHaveBeenCalled();
    });
  });
});

describe("speedControl feature flag subscription", () => {
  let cleanup: () => void;
  let speedWrapper: HTMLDivElement;

  beforeEach(async () => {
    vi.resetModules();
    fakeAppCore = new FakeAppCore();
    fakeMusicPlayer = new FakeMusicPlayer();
    speedWrapper = makeSpeedWrapper();
    mockGetState.mockReturnValue(makeGuiState([speedWrapper]));
    fakeToast.mockReset();

    const { setupStoreSubscriptions } = await import("@/app/features/store-subscriptions");
    cleanup = setupStoreSubscriptions();
  });

  afterEach(() => {
    cleanup();
  });

  it("hides the speed wrapper when speedControl flag is disabled", () => {
    const flags = { ...fakeAppCore.getState().featureFlags, speedControl: false };
    fakeAppCore.dispatch({ type: "SET_FEATURE_FLAGS" as never, payload: flags as never });
    expect(speedWrapper.hidden).toBe(true);
  });

  it("shows the speed wrapper when speedControl flag is re-enabled", () => {
    const disabledFlags = { ...fakeAppCore.getState().featureFlags, speedControl: false };
    fakeAppCore.dispatch({ type: "SET_FEATURE_FLAGS" as never, payload: disabledFlags as never });

    const enabledFlags = { ...fakeAppCore.getState().featureFlags, speedControl: true };
    fakeAppCore.dispatch({ type: "SET_FEATURE_FLAGS" as never, payload: enabledFlags as never });
    expect(speedWrapper.hidden).toBe(false);
  });

  it("resets playback speed to 1× when speedControl is disabled", () => {
    fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 2 as never });

    const flags = { ...fakeAppCore.getState().featureFlags, speedControl: false };
    fakeAppCore.dispatch({ type: "SET_FEATURE_FLAGS" as never, payload: flags as never });

    expect(fakeAppCore.getState().playbackSpeed).toBe(1);
  });
});

describe("speed label click-to-edit", () => {
  let wrapper: HTMLDivElement;
  let label: HTMLElement;
  let input: HTMLInputElement;
  let cleanup: () => void;

  beforeEach(() => {
    fakeAppCore = new FakeAppCore();
    wrapper = makeSpeedWrapper();
    label = speedLabel(wrapper)!;
    input = speedCustomInput(wrapper)!;
    cleanup = setupSpeedLabelClickBehavior(wrapper);
  });

  afterEach(() => {
    cleanup();
  });

  it("clicking the label hides it and shows the custom input", () => {
    label.click();
    expect(label.hidden).toBe(true);
    expect(input.hidden).toBe(false);
  });

  it("pre-fills the input with the current playback speed", () => {
    fakeAppCore = new FakeAppCore({ playbackSpeed: 1.5 });
    cleanup();
    cleanup = setupSpeedLabelClickBehavior(wrapper);
    label.click();
    expect(input.value).toBe("1.5");
  });

  it("pressing Enter with a valid value dispatches setPlaybackSpeed", () => {
    label.click();
    input.value = "2";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(fakeAppCore.getState().playbackSpeed).toBe(2);
  });

  it("pressing Enter with a valid value closes the input and restores the label", () => {
    label.click();
    input.value = "2";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(input.hidden).toBe(true);
    expect(label.hidden).toBe(false);
  });

  it("pressing Enter with an out-of-range value sets aria-invalid and keeps the input open", () => {
    label.click();
    input.value = "99";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.hidden).toBe(false);
    expect(label.hidden).toBe(true);
  });

  it("pressing Enter with a non-numeric value sets aria-invalid", () => {
    label.click();
    input.value = "fast";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("pressing Enter with an invalid value does not dispatch", () => {
    label.click();
    input.value = "0";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(fakeAppCore.getState().playbackSpeed).toBe(1); // unchanged default
  });

  it("pressing Escape closes the input without dispatching", () => {
    label.click();
    input.value = "3";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(input.hidden).toBe(true);
    expect(label.hidden).toBe(false);
    expect(fakeAppCore.getState().playbackSpeed).toBe(1); // unchanged
  });

  it("typing clears the aria-invalid state", () => {
    label.click();
    input.value = "bad";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(input.getAttribute("aria-invalid")).toBe("true");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(input.hasAttribute("aria-invalid")).toBe(false);
  });

  it("blurring with a valid value dispatches and closes", () => {
    label.click();
    input.value = "0.5";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    expect(fakeAppCore.getState().playbackSpeed).toBe(0.5);
    expect(input.hidden).toBe(true);
    expect(label.hidden).toBe(false);
  });

  it("blurring with an invalid value closes without dispatching", () => {
    label.click();
    input.value = "999";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    expect(fakeAppCore.getState().playbackSpeed).toBe(1); // unchanged
    expect(input.hidden).toBe(true);
    expect(label.hidden).toBe(false);
  });

  it("blurring when already closed is a no-op", () => {
    // input is already hidden; blur should not dispatch
    expect(input.hidden).toBe(true);
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    expect(fakeAppCore.getState().playbackSpeed).toBe(1);
  });

  it("the label has role=button and tabindex=0 for keyboard accessibility", () => {
    expect(label.getAttribute("role")).toBe("button");
    expect(label.getAttribute("tabindex")).toBe("0");
  });

  it("label starts with aria-expanded=false", () => {
    expect(label.getAttribute("aria-expanded")).toBe("false");
  });

  it("label aria-expanded becomes true when input opens", () => {
    label.click();
    expect(label.getAttribute("aria-expanded")).toBe("true");
  });

  it("label aria-expanded returns to false when input closes", () => {
    label.click();
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(label.getAttribute("aria-expanded")).toBe("false");
  });

  it("pressing Enter with a valid value returns focus to the label", () => {
    document.body.appendChild(wrapper);
    label.click();
    input.value = "2";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(document.activeElement).toBe(label);
    document.body.removeChild(wrapper);
  });

  it("pressing Enter on the label opens the input", () => {
    label.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(input.hidden).toBe(false);
    expect(label.hidden).toBe(true);
  });

  it("pressing Space on the label opens the input", () => {
    label.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(input.hidden).toBe(false);
    expect(label.hidden).toBe(true);
  });

  it("cleanup removes event listeners so click no longer opens the input", () => {
    cleanup();
    label.click();
    expect(input.hidden).toBe(true); // still hidden — handler removed
    cleanup = () => {}; // avoid double-call in afterEach
  });
});

describe("handleSpeedSlider — tick snapping", () => {
  const makeSlider = (value: string): HTMLInputElement => {
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "8";
    slider.step = "any";
    slider.value = value;
    return slider;
  };

  const fireInput = (slider: HTMLInputElement): void => {
    const event = new Event("input", { bubbles: true });
    Object.defineProperty(event, "currentTarget", { value: slider });
    handleSpeedSlider(event);
  };

  beforeEach(() => {
    fakeAppCore = new FakeAppCore();
  });

  it("dispatches the predefined step at an exact integer position", () => {
    const slider = makeSlider("3"); // index 3 → 1×
    fireInput(slider);
    expect(fakeAppCore.getState().playbackSpeed).toBe(1);
  });

  it("snaps the thumb to the nearest integer when the raw position is fractional", () => {
    const slider = makeSlider("4.2"); // between 1.25× (4) and 1.5× (5), closer to 4
    fireInput(slider);
    expect(slider.value).toBe("4"); // thumb corrected
    expect(fakeAppCore.getState().playbackSpeed).toBe(1.25);
  });

  it("rounds up to the next tick when the fractional position is past the midpoint", () => {
    const slider = makeSlider("4.7"); // closer to 5 → 1.5×
    fireInput(slider);
    expect(slider.value).toBe("5");
    expect(fakeAppCore.getState().playbackSpeed).toBe(1.5);
  });

  it("clamps to the first tick when position is below 0", () => {
    const slider = makeSlider("-1");
    fireInput(slider);
    expect(slider.value).toBe("0");
    expect(fakeAppCore.getState().playbackSpeed).toBe(0.25);
  });

  it("clamps to the last tick when position is above the maximum index", () => {
    const slider = makeSlider("9");
    fireInput(slider);
    expect(slider.value).toBe("8");
    expect(fakeAppCore.getState().playbackSpeed).toBe(5);
  });
});

describe("setupSpeedPopoverBehavior — popover hide guard", () => {
  const popoverClass = PLUME_ELEM_SELECTORS.speedPopover.split(".")[1];
  const visibleClass = `${popoverClass}--visible`;

  const makeWrapperWithPopover = (): {
    wrapper: HTMLDivElement;
    popover: HTMLDivElement;
    customInput: HTMLInputElement;
  } => {
    const wrapper = document.createElement("div");
    document.body.appendChild(wrapper);

    const popover = document.createElement("div");
    popover.className = popoverClass;
    popover.classList.add(visibleClass);

    const customInput = document.createElement("input");
    customInput.type = "text";
    customInput.className = PLUME_ELEM_SELECTORS.speedCustomInput.split(".")[1];
    customInput.hidden = true;

    popover.appendChild(customInput);
    wrapper.appendChild(popover);
    return { wrapper, popover, customInput };
  };

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("schedules hide on mouseleave when the custom input is closed", async () => {
    const { wrapper, popover } = makeWrapperWithPopover();
    const cleanup = setupSpeedPopoverBehavior(wrapper);

    wrapper.dispatchEvent(new MouseEvent("mouseenter"));
    wrapper.dispatchEvent(new MouseEvent("mouseleave"));

    // Not hidden yet (timer pending)
    expect(popover.classList.contains(visibleClass)).toBe(true);

    await new Promise((r) => setTimeout(r, 750));
    expect(popover.classList.contains(visibleClass)).toBe(false);
    cleanup();
  });

  it("does not schedule hide on mouseleave while the custom input is open", async () => {
    const { wrapper, popover, customInput } = makeWrapperWithPopover();
    const cleanup = setupSpeedPopoverBehavior(wrapper);

    customInput.hidden = false; // simulate open state
    wrapper.dispatchEvent(new MouseEvent("mouseenter"));
    wrapper.dispatchEvent(new MouseEvent("mouseleave"));

    await new Promise((r) => setTimeout(r, 750));
    expect(popover.classList.contains(visibleClass)).toBe(true);
    cleanup();
  });

  it("allows hide to proceed once the custom input is closed", async () => {
    const { wrapper, popover, customInput } = makeWrapperWithPopover();
    const cleanup = setupSpeedPopoverBehavior(wrapper);

    customInput.hidden = false;
    wrapper.dispatchEvent(new MouseEvent("mouseenter"));
    wrapper.dispatchEvent(new MouseEvent("mouseleave")); // guard fires — no timer set

    customInput.hidden = true; // input closes
    wrapper.dispatchEvent(new MouseEvent("mouseleave")); // now the guard passes

    await new Promise((r) => setTimeout(r, 750));
    expect(popover.classList.contains(visibleClass)).toBe(false);
    cleanup();
  });

  it("sets aria-hidden=false on mouseenter", () => {
    const { wrapper, popover } = makeWrapperWithPopover();
    popover.ariaHidden = "true";
    const cleanup = setupSpeedPopoverBehavior(wrapper);

    wrapper.dispatchEvent(new MouseEvent("mouseenter"));
    expect(popover.ariaHidden).toBe("false");
    cleanup();
  });

  it("sets aria-hidden=true after the hide timer fires", async () => {
    const { wrapper, popover } = makeWrapperWithPopover();
    popover.ariaHidden = "false";
    const cleanup = setupSpeedPopoverBehavior(wrapper);

    wrapper.dispatchEvent(new MouseEvent("mouseenter"));
    wrapper.dispatchEvent(new MouseEvent("mouseleave"));

    await new Promise((r) => setTimeout(r, 750));
    expect(popover.ariaHidden).toBe("true");
    cleanup();
  });
});

describe("handleSpeedSliderKeydown — keyboard navigation", () => {
  const makeSlider = (value: string): HTMLInputElement => {
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "8";
    slider.step = "any";
    slider.value = value;
    return slider;
  };

  const fireKey = (slider: HTMLInputElement, key: string): KeyboardEvent => {
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
    Object.defineProperty(event, "currentTarget", { value: slider });
    handleSpeedSliderKeydown(event);
    return event;
  };

  beforeEach(() => {
    fakeAppCore = new FakeAppCore();
  });

  it("ArrowRight advances to the next tick from an exact position", () => {
    const slider = makeSlider("3"); // index 3 → 1×
    fireKey(slider, "ArrowRight");
    expect(slider.value).toBe("4"); // index 4 → 1.25×
    expect(fakeAppCore.getState().playbackSpeed).toBe(1.25);
  });

  it("ArrowLeft retreats to the previous tick from an exact position", () => {
    const slider = makeSlider("3"); // index 3 → 1×
    fireKey(slider, "ArrowLeft");
    expect(slider.value).toBe("2"); // index 2 → 0.75×
    expect(fakeAppCore.getState().playbackSpeed).toBe(0.75);
  });

  it("ArrowUp behaves identically to ArrowRight", () => {
    const slider = makeSlider("3");
    fireKey(slider, "ArrowUp");
    expect(slider.value).toBe("4");
    expect(fakeAppCore.getState().playbackSpeed).toBe(1.25);
  });

  it("ArrowDown behaves identically to ArrowLeft", () => {
    const slider = makeSlider("3");
    fireKey(slider, "ArrowDown");
    expect(slider.value).toBe("2");
    expect(fakeAppCore.getState().playbackSpeed).toBe(0.75);
  });

  it("Home jumps to the first tick", () => {
    const slider = makeSlider("5");
    fireKey(slider, "Home");
    expect(slider.value).toBe("0");
    expect(fakeAppCore.getState().playbackSpeed).toBe(0.25);
  });

  it("End jumps to the last tick", () => {
    const slider = makeSlider("3");
    fireKey(slider, "End");
    expect(slider.value).toBe("8");
    expect(fakeAppCore.getState().playbackSpeed).toBe(5);
  });

  it("ArrowRight from a fractional position moves to the tick above", () => {
    const slider = makeSlider("4.2"); // custom speed between index 4 (1.25×) and 5 (1.5×)
    fireKey(slider, "ArrowRight");
    expect(slider.value).toBe("5"); // Math.floor(4.2) + 1 = 5
    expect(fakeAppCore.getState().playbackSpeed).toBe(1.5);
  });

  it("ArrowLeft from a fractional position moves to the tick below", () => {
    const slider = makeSlider("4.2");
    fireKey(slider, "ArrowLeft");
    expect(slider.value).toBe("4"); // Math.ceil(4.2) - 1 = 4
    expect(fakeAppCore.getState().playbackSpeed).toBe(1.25);
  });

  it("ArrowLeft clamps at the first tick", () => {
    const slider = makeSlider("0");
    fireKey(slider, "ArrowLeft");
    expect(slider.value).toBe("0");
    expect(fakeAppCore.getState().playbackSpeed).toBe(0.25);
  });

  it("ArrowRight clamps at the last tick", () => {
    const slider = makeSlider("8");
    fireKey(slider, "ArrowRight");
    expect(slider.value).toBe("8");
    expect(fakeAppCore.getState().playbackSpeed).toBe(5);
  });

  it("calls preventDefault for handled keys", () => {
    const slider = makeSlider("3");
    const event = fireKey(slider, "ArrowRight");
    expect(event.defaultPrevented).toBe(true);
  });

  it("does not call preventDefault for unhandled keys", () => {
    const slider = makeSlider("3");
    const event = fireKey(slider, "Tab");
    expect(event.defaultPrevented).toBe(false);
  });

  it("does not dispatch for unhandled keys", () => {
    const slider = makeSlider("3");
    fireKey(slider, "Tab");
    expect(fakeAppCore.getState().playbackSpeed).toBe(1); // unchanged default
  });
});
