// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/shared/logger", () => ({ CPL: { WARN: "warn", INFO: "info" }, logger: vi.fn() }));

interface FakeBcPlayerOptions {
  durations: (string | null)[];
  playable: boolean[];
  background: string;
}

let fakeBcPlayer: {
  getTrackRowDurations: () => (string | null)[];
  getTrackPlayabilityMap: () => boolean[];
  getInfoSection: () => HTMLDivElement;
  getPageBackground: () => HTMLElement;
};

const buildFakeBcPlayer = (opts: FakeBcPlayerOptions): typeof fakeBcPlayer => {
  const background = document.createElement("div");
  background.style.background = opts.background;
  document.body.appendChild(background);

  const infoSection = document.createElement("div");
  infoSection.id = "name-section";
  infoSection.appendChild(document.createElement("h2"));
  infoSection.appendChild(document.createElement("h3"));
  document.body.appendChild(infoSection);

  return {
    getTrackRowDurations: () => opts.durations,
    getTrackPlayabilityMap: () => opts.playable,
    getInfoSection: () => infoSection,
    getPageBackground: () => background,
  };
};

vi.mock("@/app/stores/adapters", () => ({ getBcPlayerInstance: () => fakeBcPlayer }));

import { getInfoSectionWithRuntime } from "@/app/features/runtime";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("runtime span color contrast (L5 — no alpha on the resolved color)", () => {
  it("uses fully opaque black on a light page background", () => {
    fakeBcPlayer = buildFakeBcPlayer({ durations: ["3:00"], playable: [true], background: "rgb(255, 255, 255)" });

    const section = getInfoSectionWithRuntime();
    const runtimeSpan = section.querySelector<HTMLElement>(".runtime")!;

    expect(runtimeSpan.style.color.toLowerCase()).not.toMatch(/rgba|7f$/);
    expect(runtimeSpan.style.color).toMatch(/^(#000000|rgb\(0,\s*0,\s*0\))$/i);
  });

  it("uses fully opaque white on a dark page background", () => {
    fakeBcPlayer = buildFakeBcPlayer({ durations: ["3:00"], playable: [true], background: "rgb(10, 10, 10)" });

    const section = getInfoSectionWithRuntime();
    const runtimeSpan = section.querySelector<HTMLElement>(".runtime")!;

    expect(runtimeSpan.style.color.toLowerCase()).not.toMatch(/rgba|7f$/);
    expect(runtimeSpan.style.color).toMatch(/^(#ffffff|rgb\(255,\s*255,\s*255\))$/i);
  });
});
