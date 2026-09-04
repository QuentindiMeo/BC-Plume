// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/shared/logger", () => ({ logger: vi.fn(), CPL: { ERROR: "error" } }));

const mockSaveTracklistDropdownHeight = vi.fn().mockResolvedValue(undefined);
vi.mock("@/popup/use-cases/saveTracklistDropdownHeight", () => ({
  saveTracklistDropdownHeight: (...args: unknown[]) => mockSaveTracklistDropdownHeight(...args),
}));
vi.mock("@/popup/use-cases/saveForcedLanguage", () => ({ saveForcedLanguage: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/popup/use-cases/saveSeekJumpDuration", () => ({
  saveSeekJumpDuration: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/popup/use-cases/saveVolumeHotkeyStep", () => ({
  saveVolumeHotkeyStep: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/popup/use-cases/saveTrackRestartThreshold", () => ({
  saveTrackRestartThreshold: vi.fn().mockResolvedValue(undefined),
}));

import { PLUME_CONSTANTS, PLUME_DEFAULTS } from "@/domain/plume";
import { createGeneralTab } from "@/popup/components/GeneralTab";
import { FakeMessageSender } from "../../fakes/FakeMessageSender";

const sender = new FakeMessageSender();

const buildPanel = (tracklistDropdownHeight: number | undefined = undefined): HTMLDivElement =>
  createGeneralTab(undefined, undefined, undefined, tracklistDropdownHeight as never, undefined, sender)();

const getSlider = (panel: HTMLElement): HTMLInputElement =>
  panel.querySelector("#tracklist-dropdown-height-slider") as HTMLInputElement;

const getValueDisplay = (panel: HTMLElement): HTMLElement =>
  panel.querySelector(".general-row__slider-value") as HTMLElement;

const getResetBtn = (slider: HTMLInputElement): HTMLButtonElement =>
  slider.closest(".setting-row")!.querySelector(".general-row__reset-link") as HTMLButtonElement;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("tracklist dropdown height slider", () => {
  it("has min/max bounds of 2 and 10", () => {
    const panel = buildPanel();
    const slider = getSlider(panel);
    expect(slider.min).toBe("2");
    expect(slider.max).toBe("10");
  });

  it("renders the initial stored value", () => {
    const panel = buildPanel(7);
    const slider = getSlider(panel);
    expect(slider.value).toBe("7");
    expect(getValueDisplay(panel).textContent).toContain("7");
  });

  it("falls back to the default value when nothing is stored", () => {
    const panel = buildPanel(undefined);
    const slider = getSlider(panel);
    expect(slider.value).toBe(String(PLUME_DEFAULTS.tracklistDropdownHeight));
  });

  it("updates the displayed value immediately on drag, before persisting", () => {
    const panel = buildPanel(5);
    const slider = getSlider(panel);

    slider.value = "8";
    slider.dispatchEvent(new Event("input"));

    expect(getValueDisplay(panel).textContent).toContain("8");
    expect(mockSaveTracklistDropdownHeight).not.toHaveBeenCalled();
  });

  it("persists the value after the debounce window following drag input", () => {
    const panel = buildPanel(5);
    const slider = getSlider(panel);

    slider.value = "8";
    slider.dispatchEvent(new Event("input"));
    vi.advanceTimersByTime(PLUME_CONSTANTS.WCAG_INTERACTION_TIMEOUT_MS);

    expect(mockSaveTracklistDropdownHeight).toHaveBeenCalledWith(8, sender);
  });

  it("persists immediately on release (change event), without waiting for the debounce", () => {
    const panel = buildPanel(5);
    const slider = getSlider(panel);

    slider.value = "9";
    slider.dispatchEvent(new Event("input"));
    slider.dispatchEvent(new Event("change"));

    expect(mockSaveTracklistDropdownHeight).toHaveBeenCalledWith(9, sender);
  });

  it("shows the reset link only once the value differs from the default", () => {
    const panel = buildPanel(5); // default
    const slider = getSlider(panel);
    const resetBtn = getResetBtn(slider);
    expect(resetBtn.hidden).toBe(true);

    slider.value = "9";
    slider.dispatchEvent(new Event("input"));
    expect(resetBtn.hidden).toBe(false);
  });

  it("reset link restores the default value and persists it", () => {
    const panel = buildPanel(9);
    const slider = getSlider(panel);
    const resetBtn = getResetBtn(slider);
    expect(resetBtn.hidden).toBe(false);

    resetBtn.click();

    expect(slider.value).toBe("5");
    expect(getValueDisplay(panel).textContent).toContain("5");
    expect(mockSaveTracklistDropdownHeight).toHaveBeenCalledWith(5, sender);
    expect(resetBtn.hidden).toBe(true);
  });
});
