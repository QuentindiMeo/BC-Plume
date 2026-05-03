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
