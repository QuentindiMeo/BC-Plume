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
  getTrackPlayabilityMap: () => [true, true, false],
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

  it("clicking a playable item navigates to the correct index and keeps the panel open", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    const playable = items(dropdownEl).filter((i) => !i.classList.contains("bpe-tracklist-item--unplayable"));
    playable[1].click(); // second playable item → track index 1
    expect(vi.mocked(navigateToTrack)).toHaveBeenCalledWith(1, fakeBcPlayer);
    expect(dropdownEl.classList.contains("is-open")).toBe(true);
  });

  it("outside pointer-down does not close the panel", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(dropdownEl.classList.contains("is-open")).toBe(true);
  });

  it("Escape on document does not close the panel", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    press(document, "Escape");
    expect(dropdownEl.classList.contains("is-open")).toBe(true);
  });

  it("Escape keydown inside the dropdown does not close the panel", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    press(dropdownEl, "Escape");
    expect(dropdownEl.classList.contains("is-open")).toBe(true);
  });

  it("cleanup does not close an open panel", () => {
    const { toggleBtn, dropdownEl, cleanup } = setup();
    toggleBtn.click();
    cleanup();
    expect(dropdownEl.classList.contains("is-open")).toBe(true);
  });
});

describe("scroll centering on open", () => {
  let scrollIntoViewSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fakeAppCore = new FakeAppCore({ trackTitle: "Track A" });
    scrollIntoViewSpy = vi.spyOn(window.HTMLElement.prototype, "scrollIntoView");
  });

  afterEach(() => {
    cleanupFn?.();
    vi.restoreAllMocks();
  });

  // happy-dom does not propagate propertyName from TransitionEventInit, so we set it manually
  const fireTransitionEnd = (dropdownEl: HTMLDivElement, property = "max-height"): void => {
    const event = new Event("transitionend") as TransitionEvent;
    Object.defineProperty(event, "propertyName", { value: property });
    dropdownEl.dispatchEvent(event);
  };

  it("scrolls the active item into view after the max-height transition completes", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    fireTransitionEnd(dropdownEl);
    // fakeBcPlayer has 3 tracks; all indices (0, 1, 2) qualify as edge tracks → scrollIntoView
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({ block: "nearest", behavior: "smooth" });
  });

  it("does not scroll for unrelated CSS transitions", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    fireTransitionEnd(dropdownEl, "opacity");
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  });

  it("does not scroll when no active item is present", () => {
    fakeAppCore = new FakeAppCore({ trackTitle: null });
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    fireTransitionEnd(dropdownEl);
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  });
});
