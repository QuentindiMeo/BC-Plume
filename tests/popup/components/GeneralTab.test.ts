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
  createGeneralTab(undefined, tracklistDropdownHeight as never, undefined, undefined, undefined, sender)();

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

describe("numeric input error message", () => {
  const getSeekJumpInput = (panel: HTMLElement): HTMLInputElement =>
    panel.querySelector("#seek-jump-duration-input") as HTMLInputElement;

  const getSeekJumpError = (panel: HTMLElement): HTMLElement =>
    panel.querySelector("#seek-jump-duration-input-error") as HTMLElement;

  it("reveals the error region before writing its text, one frame apart", async () => {
    const panel = buildPanel();
    const input = getSeekJumpInput(panel);
    const error = getSeekJumpError(panel);
    expect(error.hidden).toBe(true);

    input.value = "0"; // below SEEK_JUMP_DURATION_MIN
    input.dispatchEvent(new Event("input"));

    // Revealed synchronously...
    expect(error.hidden).toBe(false);
    // ...but not yet filled — the mutation is deferred so it happens after the region
    // is already in the accessibility tree, not before.
    expect(error.textContent).toBe("");

    await vi.advanceTimersByTimeAsync(20);
    expect(error.textContent).toBe("ERROR__SEEK_JUMP_DURATION__OUT_OF_RANGE");
  });

  it("hides the error immediately (no deferred write needed) once the value becomes valid", async () => {
    const panel = buildPanel();
    const input = getSeekJumpInput(panel);
    const error = getSeekJumpError(panel);

    input.value = "0";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(20);
    expect(error.hidden).toBe(false);

    input.value = "10";
    input.dispatchEvent(new Event("input"));
    expect(error.hidden).toBe(true);
    expect(error.textContent).toBe("");
  });
});

describe("refresh-required notice", () => {
  const getRefreshNotice = (panel: HTMLElement): HTMLElement =>
    panel.querySelector(".general-row__refresh-notice") as HTMLElement;

  const getLanguageSelect = (panel: HTMLElement): HTMLSelectElement =>
    panel.querySelector("#forced-language-select") as HTMLSelectElement;

  it("has role=status and starts hidden", () => {
    const panel = buildPanel();
    const notice = getRefreshNotice(panel);

    expect(notice.getAttribute("role")).toBe("status");
    expect(notice.hidden).toBe(true);
  });

  it("reveals before writing its text, one frame apart, after a language change", async () => {
    const panel = buildPanel();
    const notice = getRefreshNotice(panel);
    const select = getLanguageSelect(panel);

    select.value = "fr";
    select.dispatchEvent(new Event("change"));

    // ? Flush the awaited saveForcedLanguage() microtask without advancing fake timers yet,
    // ? so the deferred rAF text write has not fired.
    await Promise.resolve();
    await Promise.resolve();

    expect(notice.hidden).toBe(false);
    expect(notice.textContent).toBe("");

    await vi.advanceTimersByTimeAsync(20);
    expect(notice.textContent).toBe("INFO__SETTING__REFRESH_REQUIRED");
  });
});
