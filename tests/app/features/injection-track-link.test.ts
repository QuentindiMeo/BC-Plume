// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/infra/elements/plume", () => ({
  PLUME_ELEM_SELECTORS: {
    plumeContainer: "div#plume-plume",
    headerContainer: "div#plume-header-container",
    headerLogo: "a#plume-header-logo",
    headerCurrent: "div#plume-header-current",
    headerTitlePretext: "span#plume-header-title-pretext",
    headerTitle: "span#plume-header-title",
    headerTrackLink: "a#plume-header-track-link",
    tracklistToggleBtn: "button#plume-tracklist-toggle-btn",
    tracklistDropdown: "div#plume-tracklist-dropdown",
    playbackManager: "div#plume-playback-manager",
    progressContainer: "div#plume-progress-container",
    fullscreenBtnContainer: "div#plume-fullscreen-btn-container",
  },
}));
vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k, getActiveLocale: () => "en" }));
vi.mock("@/shared/logger", () => ({ CPL: { WARN: "warn", LOG: "log", ERROR: "error" }, logger: vi.fn() }));
vi.mock("@/shared/svg", () => ({
  createSafeSvgElement: () => document.createElementNS("http://www.w3.org/2000/svg", "svg"),
}));
vi.mock("@/svg/icons", () => ({ PLUME_SVG: { logo: "", externalLink: "", chevronDown: "" } }));
vi.mock("@/domain/meta", () => ({ APP_VERSION: "0.0.0-test", PLUME_LINKTREE_URL: "https://example.com" }));
vi.mock("@/domain/ports/app-core", async (importOriginal: () => Promise<typeof import("@/domain/ports/app-core")>) => {
  const actual = await importOriginal();
  return { ...actual };
});
vi.mock("@/domain/ports/plume-ui", async (importOriginal: () => Promise<typeof import("@/domain/ports/plume-ui")>) => {
  const actual = await importOriginal();
  return { ...actual };
});

let mockTrackUrl: string | null = "/track/test-track";
const fakeBcPlayer = {
  getTrackTitle: () => "Test Track",
  getTrackRows: () => [] as HTMLTableRowElement[],
  getTrackRowTitles: () => ["Test Track"],
  getTrackRowDurations: () => ["3:00"],
  getTrackPlayabilityMap: () => [true],
  getCurrentTrackUrl: () => mockTrackUrl,
  getTrackView: () => null,
  getInfoSection: () => null,
};
vi.mock("@/app/stores/adapters", () => ({ getBcPlayerInstance: () => fakeBcPlayer }));

import { FakeAppCore } from "../../fakes/FakeAppCore";

let fakeAppCore = new FakeAppCore({ pageType: "album" });
vi.mock("@/app/stores/AppCoreImpl", () => ({ getAppCoreInstance: () => fakeAppCore }));
vi.mock("@/app/stores/GuiImpl", () => ({
  getGuiInstance: () => ({
    dispatch: vi.fn(),
    getState: () => ({}),
  }),
}));
vi.mock("@/app/features/track-title", () => ({
  getCurrentTrackTitle: () => "Test Track",
  getAppropriateAccentColor: () => "rgb(100, 200, 150)",
}));
vi.mock("@/app/features/track-quantifiers", () => ({
  getTrackQuantifiers: () => ({ current: 1, total: 5 }),
}));
const playerContainer = document.createElement("div");
vi.mock("@/app/features/original-player", () => ({
  findOriginalPlayerContainer: () => playerContainer,
  hideOriginalPlayerElements: vi.fn(),
}));
vi.mock("@/app/features/ui", () => ({
  createPlaybackControlPanel: () => document.createElement("div"),
  createProgressBar: () => document.createElement("div"),
  createVolumeControlSection: async () => document.createElement("div"),
  createFullscreenButtonSection: () => document.createElement("div"),
  createTracklistToggle: () => ({
    toggleBtn: document.createElement("button"),
    dropdownEl: document.createElement("div"),
    cleanup: () => {},
  }),
}));
vi.mock("@/app/features/fullscreen", () => ({ toggleFullscreenMode: vi.fn() }));

import { injectEnhancements } from "@/app/features/injection";

beforeEach(() => {
  document.body.innerHTML = "";
  playerContainer.innerHTML = "";
  document.body.appendChild(playerContainer);
  mockTrackUrl = "/track/test-track";
  fakeAppCore = new FakeAppCore({ pageType: "album" });
});

describe("track link in injection", () => {
  it("creates a track link element on album pages", async () => {
    const { ok } = await injectEnhancements();
    expect(ok).toBe(true);

    const trackLink = document.querySelector("a#plume-header-track-link") as HTMLAnchorElement;
    expect(trackLink).not.toBeNull();
    expect(trackLink.id).toBe("plume-header-track-link");
  });

  it("does not create a track link element on track pages", async () => {
    fakeAppCore = new FakeAppCore({ pageType: "track" });
    const { ok } = await injectEnhancements();
    expect(ok).toBe(true);

    const trackLink = document.querySelector("a#plume-header-track-link");
    expect(trackLink).toBeNull();
  });

  it("sets the href from getCurrentTrackUrl when available", async () => {
    await injectEnhancements();

    const trackLink = document.querySelector("a#plume-header-track-link") as HTMLAnchorElement;
    expect(trackLink.href).toContain("/track/test-track");
    expect(trackLink.ariaDisabled).toBe("false");
    expect(trackLink.tabIndex).toBe(0);
  });

  it("disables the track link when getCurrentTrackUrl returns null", async () => {
    mockTrackUrl = null;
    await injectEnhancements();

    const trackLink = document.querySelector("a#plume-header-track-link") as HTMLAnchorElement;
    expect(trackLink).not.toBeNull();
    expect(trackLink.hasAttribute("href")).toBe(false);
    expect(trackLink.ariaDisabled).toBe("true");
    expect(trackLink.style.pointerEvents).toBe("none");
    expect(trackLink.tabIndex).toBe(-1);
  });

  it("sets correct ARIA attributes on the track link", async () => {
    await injectEnhancements();

    const trackLink = document.querySelector("a#plume-header-track-link") as HTMLAnchorElement;
    expect(trackLink.ariaLabel).toBe("ARIA__TRACK_LINK");
    expect(trackLink.title).toBe("ARIA__TRACK_LINK");
  });

  it("contains an SVG icon inside the track link", async () => {
    await injectEnhancements();

    const trackLink = document.querySelector("a#plume-header-track-link") as HTMLAnchorElement;
    const svg = trackLink.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("places the track link before the title span in the title row", async () => {
    await injectEnhancements();

    const titleRow = document.querySelector(".plume-header-title-row") as HTMLDivElement;
    const children = Array.from(titleRow.children);
    const linkIdx = children.findIndex((el) => el.id === "plume-header-track-link");
    const titleIdx = children.findIndex((el) => el.id === "plume-header-title");
    expect(linkIdx).toBeLessThan(titleIdx);
  });
});
