// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeAppCore } from "../../../fakes/FakeAppCore";

vi.mock("@/infra/elements/plume", () => ({
  PLUME_ELEM_SELECTORS: {
    tracklistDropdown: "div#bpe-tracklist-dropdown",
    tracklistToggleBtn: "button#bpe-tracklist-toggle-btn",
    tracklistItem: "div.bpe-tracklist-item",
  },
}));
vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/shared/svg", () => ({ setSvgContent: vi.fn() }));
vi.mock("@/svg/icons", () => ({ PLUME_SVG: { chevronDown: "" } }));
vi.mock("@/app/use-cases", () => ({ navigateToTrack: vi.fn() }));

let fakeAppCore = new FakeAppCore({ trackTitle: "Track A" });
vi.mock("@/app/stores/AppCoreImpl", () => ({ getAppCoreInstance: () => fakeAppCore }));

const fakeBcPlayer = {
  getTrackRows: () => [makeLinkedRow(), makeLinkedRow(), makeUnlinkedRow()],
  getTrackRowTitles: () => ["Track A", "Track B", "Track C"],
  getTrackRowDurations: () => ["3:00", "4:00", "----"],
};
vi.mock("@/app/stores/adapters", () => ({ getBcPlayerInstance: () => fakeBcPlayer }));

import { createTracklistToggle } from "@/app/features/ui/tracklist";
import { navigateToTrack } from "@/app/use-cases";

const makeLinkedRow = () => ({ classList: { contains: (c: string) => c === "linked" } });
const makeUnlinkedRow = () => ({ classList: { contains: () => false } });

const press = (target: EventTarget, key: string) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

const items = (dropdownEl: HTMLDivElement) => Array.from(dropdownEl.children) as HTMLElement[];

let cleanupFn: () => void;

beforeEach(() => {
  fakeAppCore = new FakeAppCore({ trackTitle: "Track A" });
});

afterEach(() => {
  cleanupFn?.();
  vi.clearAllMocks();
});

const setup = () => {
  const result = createTracklistToggle();
  cleanupFn = result.cleanup;
  return result;
};

describe("createTracklistToggle", () => {
  it("toggle button has correct initial ARIA attributes", () => {
    const { toggleBtn } = setup();
    expect(toggleBtn.ariaExpanded).toBe("false");
    expect(toggleBtn.ariaLabel).toBe("ARIA__TRACKLIST__TOGGLE_OPEN");
    expect(toggleBtn.title).toBe("ARIA__TRACKLIST__TOGGLE_OPEN");
  });

  it("dropdown is initially hidden", () => {
    const { dropdownEl } = setup();
    expect(dropdownEl.ariaHidden).toBe("true");
    expect(dropdownEl.classList.contains("is-open")).toBe(false);
  });

  it("opening sets is-open, updates aria attributes, and renders one item per track", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    expect(dropdownEl.classList.contains("is-open")).toBe(true);
    expect(dropdownEl.ariaHidden).toBe("false");
    expect(toggleBtn.ariaExpanded).toBe("true");
    expect(toggleBtn.ariaLabel).toBe("ARIA__TRACKLIST__TOGGLE_CLOSE");
    expect(dropdownEl.children).toHaveLength(3);
  });

  it("closing removes is-open and resets aria attributes", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    toggleBtn.click();
    expect(dropdownEl.classList.contains("is-open")).toBe(false);
    expect(dropdownEl.ariaHidden).toBe("true");
    expect(toggleBtn.ariaExpanded).toBe("false");
    expect(toggleBtn.ariaLabel).toBe("ARIA__TRACKLIST__TOGGLE_OPEN");
  });

  it("the active track item has the active class and aria-selected=true", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    const all = items(dropdownEl);
    const active = all.find((i) => i.classList.contains("bpe-tracklist-item--active"));
    expect(active).toBeDefined();
    expect(active!.ariaSelected).toBe("true");
    all
      .filter((i) => !i.classList.contains("bpe-tracklist-item--active"))
      .forEach((i) => expect(i.ariaSelected).toBe("false"));
  });

  it("an unplayable track item has aria-disabled=true and fires no navigation", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    const unplayable = items(dropdownEl).find((i) => i.classList.contains("bpe-tracklist-item--unplayable"));
    expect(unplayable).toBeDefined();
    expect(unplayable!.ariaDisabled).toBe("true");
    unplayable!.click();
    expect(vi.mocked(navigateToTrack)).not.toHaveBeenCalled();
  });

  it("clicking a playable item navigates to the correct index and closes the panel", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    const playable = items(dropdownEl).filter((i) => !i.classList.contains("bpe-tracklist-item--unplayable"));
    playable[1].click(); // second playable item → track index 1
    expect(vi.mocked(navigateToTrack)).toHaveBeenCalledWith(1, fakeBcPlayer);
    expect(dropdownEl.classList.contains("is-open")).toBe(false);
  });

  it("outside pointer-down closes the panel", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(dropdownEl.classList.contains("is-open")).toBe(false);
  });

  it("Escape on document closes the panel when focus is outside the dropdown", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    press(document, "Escape");
    expect(dropdownEl.classList.contains("is-open")).toBe(false);
  });

  it("Escape keydown inside the dropdown closes the panel", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    press(dropdownEl, "Escape");
    expect(dropdownEl.classList.contains("is-open")).toBe(false);
  });

  it("cleanup removes document listeners — outside clicks no longer close the panel", () => {
    const { toggleBtn, dropdownEl, cleanup } = setup();
    toggleBtn.click();
    cleanup();
    document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(dropdownEl.classList.contains("is-open")).toBe(true);
  });
});
