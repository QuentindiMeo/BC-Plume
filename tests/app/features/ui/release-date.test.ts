// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AXE_TEST_TIMEOUT, checkA11y } from "../../../a11y/axe-helper";

vi.mock("@/shared/logger", () => ({ CPL: { DEBUG: "debug", WARN: "warn" }, logger: vi.fn() }));

import { appendReleaseDate } from "@/app/features/ui/release-date";
import { PLUME_ELEM_SELECTORS } from "@/infra/elements/plume";
import { logger } from "@/shared/logger";

const RELEASE_DATE_ID = PLUME_ELEM_SELECTORS.fullscreenTitlingReleaseDate.split("#")[1] as string;
const RAW_DATE = "12 Apr 2019 00:00:00 GMT";

// Mirrors the fullscreen titling block: Bandcamp's cloned #name-section, h2 (release) + h3 (artist).
const buildTitlingContainer = (withArtist = true): HTMLDivElement => {
  const container = document.createElement("div");
  container.className = PLUME_ELEM_SELECTORS.fullscreenTitlingContainer.split(".")[1] as string;

  const title = document.createElement("h2");
  title.textContent = "Some Release";
  container.appendChild(title);

  if (withArtist) {
    const artist = document.createElement("h3");
    artist.textContent = "Some Artist";
    container.appendChild(artist);
  }

  return container;
};

beforeEach(() => {
  vi.mocked(logger).mockClear();
  document.body.innerHTML = "";
});

describe("appendReleaseDate", () => {
  it("inserts the release date right after the artist heading", () => {
    const container = buildTitlingContainer();

    const el = appendReleaseDate(container, RAW_DATE);

    expect(el).not.toBeNull();
    expect(el?.id).toBe(RELEASE_DATE_ID);
    expect(container.querySelector(`#${RELEASE_DATE_ID}`)).toBe(el);
    expect(Array.from(container.children).map((child) => child.tagName)).toEqual(["H2", "H3", "P"]);
  });

  it("renders the localized label and an accessible name", () => {
    const el = appendReleaseDate(buildTitlingContainer(), RAW_DATE);

    expect(el?.textContent).toBe("Released April 12, 2019");
    expect(el?.getAttribute("aria-label")).toBe("Release date is April 12, 2019");
    expect(el?.getAttribute("role")).toBe("note");
  });

  it("appends at the end when the titling block has no artist heading", () => {
    const container = buildTitlingContainer(false);

    appendReleaseDate(container, RAW_DATE);

    expect(Array.from(container.children).map((child) => child.tagName)).toEqual(["H2", "P"]);
  });

  it("skips rendering and warns when no release date is available", () => {
    const container = buildTitlingContainer();

    const el = appendReleaseDate(container, null);

    expect(el).toBeNull();
    expect(container.querySelector(`#${RELEASE_DATE_ID}`)).toBeNull();
    expect(logger).toHaveBeenCalledWith("warn", "Release date not found for fullscreen mode");
  });

  it("skips rendering and warns when the release date is unparsable", () => {
    const container = buildTitlingContainer();

    const el = appendReleaseDate(container, "released April 12, 2019");

    expect(el).toBeNull();
    expect(container.querySelector(`#${RELEASE_DATE_ID}`)).toBeNull();
    expect(logger).toHaveBeenCalledWith("warn", "Release date not found for fullscreen mode");
  });

  it("leaves the rest of the titling block untouched", () => {
    const container = buildTitlingContainer();

    appendReleaseDate(container, RAW_DATE);

    expect(container.querySelector("h2")?.textContent).toBe("Some Release");
    expect(container.querySelector("h3")?.textContent).toBe("Some Artist");
  });

  it(
    "has no accessibility violations",
    async () => {
      const container = buildTitlingContainer();
      appendReleaseDate(container, RAW_DATE);
      document.body.appendChild(container);

      await checkA11y(container);
    },
    AXE_TEST_TIMEOUT
  );
});
