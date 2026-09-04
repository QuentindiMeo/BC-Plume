// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/shared/logger", () => ({ logger: vi.fn(), CPL: { ERROR: "ERROR" } }));

const mockSaveFeatureFlags = vi.fn().mockResolvedValue(undefined);
vi.mock("@/popup/use-cases/saveFeatureFlags", () => ({
  saveFeatureFlags: (...args: unknown[]) => mockSaveFeatureFlags(...args),
}));

import type { FeatureFlags } from "@/domain/plume";
import { PLUME_DEFAULTS } from "@/domain/plume";
import { createFeatureTab } from "@/popup/components/FeatureFlippingTab";
import { FakeMessageSender } from "../../fakes/FakeMessageSender";

const sender = new FakeMessageSender();

const buildPanel = (overrides: Partial<FeatureFlags> = {}): HTMLDivElement =>
  createFeatureTab({ ...PLUME_DEFAULTS.featureFlags, ...overrides }, sender)();

const getToggle = (wrapper: HTMLElement, flagKey: string): HTMLButtonElement =>
  wrapper.querySelector(`[aria-labelledby="feature-label-${flagKey}"]`) as HTMLButtonElement;

beforeEach(() => vi.clearAllMocks());

describe("visualizer ↔ bpmDetect dependency enforcement", () => {
  it("enabling visualizer automatically enables bpmDetect", () => {
    const wrapper = buildPanel({ visualizer: false, bpmDetect: false });
    const vizToggle = getToggle(wrapper, "visualizer");
    const bpmToggle = getToggle(wrapper, "bpmDetect");

    vizToggle.click();

    expect(vizToggle.ariaChecked).toBe("true");
    expect(bpmToggle.ariaChecked).toBe("true");
  });

  it("enabling visualizer persists both flags as true", () => {
    const wrapper = buildPanel({ visualizer: false, bpmDetect: false });
    getToggle(wrapper, "visualizer").click();

    const persisted = mockSaveFeatureFlags.mock.calls[0][0] as FeatureFlags;
    expect(persisted.visualizer).toBe(true);
    expect(persisted.bpmDetect).toBe(true);
  });

  it("disabling bpmDetect automatically disables visualizer", () => {
    const wrapper = buildPanel({ visualizer: true, bpmDetect: true });
    const vizToggle = getToggle(wrapper, "visualizer");
    const bpmToggle = getToggle(wrapper, "bpmDetect");

    bpmToggle.click();

    expect(bpmToggle.ariaChecked).toBe("false");
    expect(vizToggle.ariaChecked).toBe("false");
  });

  it("disabling bpmDetect persists both flags as false", () => {
    const wrapper = buildPanel({ visualizer: true, bpmDetect: true });
    getToggle(wrapper, "bpmDetect").click();

    const persisted = mockSaveFeatureFlags.mock.calls[0][0] as FeatureFlags;
    expect(persisted.bpmDetect).toBe(false);
    expect(persisted.visualizer).toBe(false);
  });

  it("disabling visualizer alone does not affect bpmDetect", () => {
    const wrapper = buildPanel({ visualizer: true, bpmDetect: true });
    const vizToggle = getToggle(wrapper, "visualizer");
    const bpmToggle = getToggle(wrapper, "bpmDetect");

    vizToggle.click();

    expect(vizToggle.ariaChecked).toBe("false");
    expect(bpmToggle.ariaChecked).toBe("true");
  });

  it("disabling bpmDetect when visualizer is already off does not crash", () => {
    const wrapper = buildPanel({ visualizer: false, bpmDetect: true });
    const bpmToggle = getToggle(wrapper, "bpmDetect");

    expect(() => bpmToggle.click()).not.toThrow();
    expect(bpmToggle.ariaChecked).toBe("false");
  });
});

describe("tracklistExpandedByDefault flipper", () => {
  it("persists as enabled when toggled on", () => {
    const wrapper = buildPanel({ tracklistExpandedByDefault: false });
    getToggle(wrapper, "tracklistExpandedByDefault").click();

    const persisted = mockSaveFeatureFlags.mock.calls[0][0] as FeatureFlags;
    expect(persisted.tracklistExpandedByDefault).toBe(true);
  });

  it("reflects the initial off state", () => {
    const wrapper = buildPanel({ tracklistExpandedByDefault: false });
    expect(getToggle(wrapper, "tracklistExpandedByDefault").ariaChecked).toBe("false");
  });

  it("reflects the initial on state", () => {
    const wrapper = buildPanel({ tracklistExpandedByDefault: true });
    expect(getToggle(wrapper, "tracklistExpandedByDefault").ariaChecked).toBe("true");
  });
});

describe("tracklist ↔ tracklistExpandedByDefault dependency enforcement", () => {
  it("is disabled when tracklist starts off", () => {
    const wrapper = buildPanel({ tracklist: false, tracklistExpandedByDefault: false });
    expect(getToggle(wrapper, "tracklistExpandedByDefault").disabled).toBe(true);
  });

  it("starts forced off when tracklist starts off, even if it was stored as on", () => {
    const wrapper = buildPanel({ tracklist: false, tracklistExpandedByDefault: true });
    const expandedToggle = getToggle(wrapper, "tracklistExpandedByDefault");
    expect(expandedToggle.ariaChecked).toBe("false");
    expect(expandedToggle.disabled).toBe(true);
  });

  it("is enabled when tracklist starts on", () => {
    const wrapper = buildPanel({ tracklist: true });
    expect(getToggle(wrapper, "tracklistExpandedByDefault").disabled).toBe(false);
  });

  it("turning tracklist off forces tracklistExpandedByDefault off, disables it, and persists both", () => {
    const wrapper = buildPanel({ tracklist: true, tracklistExpandedByDefault: true });
    const expandedToggle = getToggle(wrapper, "tracklistExpandedByDefault");

    getToggle(wrapper, "tracklist").click();

    expect(expandedToggle.ariaChecked).toBe("false");
    expect(expandedToggle.disabled).toBe(true);
    const persisted = mockSaveFeatureFlags.mock.calls[0][0] as FeatureFlags;
    expect(persisted.tracklist).toBe(false);
    expect(persisted.tracklistExpandedByDefault).toBe(false);
  });

  it("turning tracklist back on re-enables the tracklistExpandedByDefault toggle", () => {
    const wrapper = buildPanel({ tracklist: false, tracklistExpandedByDefault: false });
    const tracklistToggle = getToggle(wrapper, "tracklist");
    const expandedToggle = getToggle(wrapper, "tracklistExpandedByDefault");

    tracklistToggle.click(); // turn tracklist on

    expect(expandedToggle.disabled).toBe(false);
  });

  it("clicking a disabled tracklistExpandedByDefault toggle has no effect", () => {
    const wrapper = buildPanel({ tracklist: false, tracklistExpandedByDefault: false });
    const expandedToggle = getToggle(wrapper, "tracklistExpandedByDefault");

    expandedToggle.click();

    expect(expandedToggle.ariaChecked).toBe("false");
    expect(mockSaveFeatureFlags).not.toHaveBeenCalled();
  });
});

describe("flipper notice (noticeKey)", () => {
  const getWaveformNotice = (wrapper: HTMLElement): HTMLParagraphElement =>
    wrapper.querySelector("#feature-label-waveform .setting-row__notice") as HTMLParagraphElement;

  it("is not rendered for flippers without a noticeKey", () => {
    const wrapper = buildPanel();
    const runtimeLabel = wrapper.querySelector("#feature-label-runtime");

    expect(runtimeLabel?.querySelector(".setting-row__notice")).toBeNull();
  });

  it("is rendered inside the flipper label for flippers with a noticeKey", () => {
    const wrapper = buildPanel({ waveform: false });
    const waveformLabel = wrapper.querySelector("#feature-label-waveform");

    expect(waveformLabel?.querySelector(".setting-row__notice")).not.toBeNull();
  });

  it("is hidden when the feature starts off", () => {
    const wrapper = buildPanel({ waveform: false });

    expect(getWaveformNotice(wrapper).hidden).toBe(true);
  });

  it("is visible when the feature starts on", () => {
    const wrapper = buildPanel({ waveform: true });

    expect(getWaveformNotice(wrapper).hidden).toBe(false);
  });

  it("becomes visible when the toggle is clicked on", () => {
    const wrapper = buildPanel({ waveform: false });
    getToggle(wrapper, "waveform").click();

    expect(getWaveformNotice(wrapper).hidden).toBe(false);
  });

  it("becomes hidden when the toggle is clicked off", () => {
    const wrapper = buildPanel({ waveform: true });
    getToggle(wrapper, "waveform").click();

    expect(getWaveformNotice(wrapper).hidden).toBe(true);
  });

  it("becomes hidden after reset when the feature was on", () => {
    const wrapper = buildPanel({ waveform: true });
    const resetBtn = wrapper.querySelector<HTMLButtonElement>(".popup__reset-btn")!;
    resetBtn.click();

    expect(getWaveformNotice(wrapper).hidden).toBe(true);
  });
});
