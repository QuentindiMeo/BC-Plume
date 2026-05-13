// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/shared/logger", () => ({ logger: vi.fn(), CPL: { ERROR: "ERROR" } }));
vi.mock("@/shared/svg", () => ({
  createSafeSvgElement: () => document.createElementNS("http://www.w3.org/2000/svg", "svg"),
}));
vi.mock("@/svg/icons", () => ({ PLUME_SVG: { logo: "" } }));
vi.mock("@/domain/meta", () => ({
  APP_VERSION: "v1.2.3",
  PLUME_AUTHOR: "Test Author",
  PLUME_LICENSE: "MIT",
  PLUME_BROWSERS: "Chrome · Firefox",
  PLUME_GITHUB_URL: "https://github.com/test",
  PLUME_ISSUES_URL: "https://github.com/test/issues",
  PLUME_CHANGELOG_URL: "https://github.com/test/changelog",
  PLUME_DONATION_URL: "https://ko-fi.com/test",
}));

import { createAboutTab } from "@/popup/components/AboutTab";

const buildPanel = (): HTMLDivElement => createAboutTab()();

const getLinkAnchors = (panel: HTMLDivElement): HTMLAnchorElement[] =>
  [...panel.querySelectorAll("#about__links-list a")] as HTMLAnchorElement[];

beforeEach(() => vi.clearAllMocks());

describe("identity block", () => {
  it("renders the logo with an accessible name", () => {
    const panel = buildPanel();
    const logo = panel.querySelector("#identity__logo");

    expect(logo).not.toBeNull();
    expect(logo?.getAttribute("role")).toBe("img");
    expect((logo as HTMLElement)?.ariaLabel).toBe("ARIA__ABOUT__LOGO");
  });

  it("renders app name from i18n key", () => {
    const panel = buildPanel();
    const name = panel.querySelector("#identity__name");

    expect(name?.textContent).toBe("APP_NAME");
  });

  it("renders major.minor version only (no patch segment)", () => {
    const panel = buildPanel();
    const version = panel.querySelector("#identity__version");

    // APP_VERSION = "v1.2.3" → substring before last dot → "v1.2"
    expect(version?.textContent).toBe("v1.2");
  });

  it("renders tagline from i18n key", () => {
    const panel = buildPanel();
    const tagline = panel.querySelector("#identity__tagline");

    expect(tagline?.textContent).toBe("APP_DESCRIPTION");
  });
});

describe("info section", () => {
  it("labels rows using i18n keys", () => {
    const panel = buildPanel();
    const labels = [...panel.querySelectorAll(".setting-row__label")].map((el) => el.textContent);

    expect(labels).toContain("LABEL__ABOUT__AUTHOR");
    expect(labels).toContain("LABEL__ABOUT__LICENSE");
    expect(labels).toContain("LABEL__ABOUT__BROWSERS");
  });

  it("renders author, license, and browsers info values", () => {
    const panel = buildPanel();
    const values = [...panel.querySelectorAll(".about__info-value")].map((el) => el.textContent);

    expect(values).toContain("Test Author");
    expect(values).toContain("MIT");
    expect(values).toContain("Chrome · Firefox");
  });
});

describe("links section", () => {
  it("renders exactly 4 link buttons", () => {
    const panel = buildPanel();

    expect(getLinkAnchors(panel).length).toBe(4);
  });

  it("all links open in a new tab with noopener noreferrer", () => {
    const panel = buildPanel();

    for (const anchor of getLinkAnchors(panel)) {
      expect(anchor.target).toBe("_blank");
      expect(anchor.rel).toContain("noreferrer");
      expect(anchor.rel).toContain("noopener");
    }
  });

  it("GitHub link points to the correct URL", () => {
    const panel = buildPanel();

    expect(getLinkAnchors(panel)[0].getAttribute("href")).toBe("https://github.com/test");
  });

  it("changelog link points to the correct URL", () => {
    const panel = buildPanel();

    expect(getLinkAnchors(panel)[1].getAttribute("href")).toBe("https://github.com/test/changelog");
  });

  it("report-issue link points to the correct URL", () => {
    const panel = buildPanel();

    expect(getLinkAnchors(panel)[2].getAttribute("href")).toBe("https://github.com/test/issues");
  });

  it("donation link points to the correct URL", () => {
    const panel = buildPanel();

    expect(getLinkAnchors(panel)[3].getAttribute("href")).toBe("https://ko-fi.com/test");
  });

  it("all links have accessible aria-label from i18n keys", () => {
    const panel = buildPanel();
    const ariaKeys = getLinkAnchors(panel).map((a) => a.ariaLabel);

    expect(ariaKeys).toContain("ARIA__ABOUT__LINK__GITHUB");
    expect(ariaKeys).toContain("ARIA__ABOUT__LINK__CHANGELOG");
    expect(ariaKeys).toContain("ARIA__ABOUT__LINK__REPORT");
    expect(ariaKeys).toContain("ARIA__ABOUT__LINK__DONATION");
  });

  it("link visible text comes from i18n key", () => {
    const panel = buildPanel();

    for (const anchor of getLinkAnchors(panel)) {
      const text = anchor.textContent ?? "";
      const startsWithKnownKey =
        text.startsWith("LABEL__ABOUT__LINK__GITHUB") ||
        text.startsWith("LABEL__ABOUT__LINK__CHANGELOG") ||
        text.startsWith("LABEL__ABOUT__LINK__REPORT") ||
        text.startsWith("LABEL__ABOUT__LINK__DONATION");

      expect(startsWithKnownKey).toBe(true);
    }
  });
});
