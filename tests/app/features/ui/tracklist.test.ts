// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PLUME_DEFAULTS } from "@/domain/plume";
import { FakeAppCore } from "../../../fakes/FakeAppCore";

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
    const active = all.find((i) => i.classList.contains("plume-tracklist-item--active"));
    expect(active).toBeDefined();
    expect(active!.ariaSelected).toBe("true");
    all
      .filter((i) => !i.classList.contains("plume-tracklist-item--active"))
      .forEach((i) => expect(i.ariaSelected).toBe("false"));
  });

  it("an unplayable track item has aria-disabled=true and fires no navigation", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    const unplayable = items(dropdownEl).find((i) => i.classList.contains("plume-tracklist-item--unplayable"));
    expect(unplayable).toBeDefined();
    expect(unplayable!.ariaDisabled).toBe("true");
    unplayable!.click();
    expect(vi.mocked(navigateToTrack)).not.toHaveBeenCalled();
  });

  it("clicking a playable item navigates to the correct index and keeps the panel open", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    const playable = items(dropdownEl).filter((i) => !i.classList.contains("plume-tracklist-item--unplayable"));
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

describe("expand/collapse state syncs across instances (main view <-> fullscreen)", () => {
  it("a second instance mounts already expanded when the shared state is expanded", () => {
    const first = setup();
    first.toggleBtn.click(); // expand via the first (e.g. main view) instance
    expect(first.dropdownEl.classList.contains("is-open")).toBe(true);

    const second = createTracklistToggle(); // e.g. entering fullscreen
    expect(second.dropdownEl.classList.contains("is-open")).toBe(true);
    expect(second.toggleBtn.ariaExpanded).toBe("true");
    second.cleanup();
  });

  it("collapsing the second instance also collapses the first (still-mounted) instance", () => {
    const first = setup();
    first.toggleBtn.click(); // expand via the first instance
    const second = createTracklistToggle(); // mounts expanded
    second.toggleBtn.click(); // collapse via the second instance (e.g. fullscreen)

    expect(second.dropdownEl.classList.contains("is-open")).toBe(false);
    expect(first.dropdownEl.classList.contains("is-open")).toBe(false);
    expect(first.toggleBtn.ariaExpanded).toBe("false");
    second.cleanup();
  });

  it("expanding the second instance also expands the first (still-mounted) instance", () => {
    const first = setup();
    const second = createTracklistToggle(); // both start collapsed
    second.toggleBtn.click(); // expand via the second instance (e.g. fullscreen)

    expect(second.dropdownEl.classList.contains("is-open")).toBe(true);
    expect(first.dropdownEl.classList.contains("is-open")).toBe(true);
    expect(first.toggleBtn.ariaExpanded).toBe("true");
    second.cleanup();
  });

  it("a cleaned-up instance no longer reacts to shared state changes", () => {
    const first = setup();
    const second = createTracklistToggle();
    second.cleanup();
    first.toggleBtn.click(); // expand via the first instance

    expect(first.dropdownEl.classList.contains("is-open")).toBe(true);
    expect(second.dropdownEl.classList.contains("is-open")).toBe(false);
  });
});

describe("tracklistAlwaysLarge feature flag", () => {
  it("applies the is-large class on mount when the flag is enabled", () => {
    fakeAppCore = new FakeAppCore({
      trackTitle: "Track A",
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, tracklistAlwaysLarge: true },
    });
    const { dropdownEl } = setup();
    expect(dropdownEl.classList.contains("is-large")).toBe(true);
  });

  it("does not apply the is-large class on mount when the flag is disabled", () => {
    fakeAppCore = new FakeAppCore({
      trackTitle: "Track A",
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, tracklistAlwaysLarge: false },
    });
    const { dropdownEl } = setup();
    expect(dropdownEl.classList.contains("is-large")).toBe(false);
  });

  it("adds the is-large class live when the flag is turned on after mount", () => {
    const { dropdownEl } = setup();
    expect(dropdownEl.classList.contains("is-large")).toBe(false);

    fakeAppCore.dispatch({
      type: "SET_FEATURE_FLAGS" as never,
      payload: { ...PLUME_DEFAULTS.featureFlags, tracklistAlwaysLarge: true } as never,
    });

    expect(dropdownEl.classList.contains("is-large")).toBe(true);
  });

  it("removes the is-large class live when the flag is turned off after mount", () => {
    fakeAppCore = new FakeAppCore({
      trackTitle: "Track A",
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, tracklistAlwaysLarge: true },
    });
    const { dropdownEl } = setup();
    expect(dropdownEl.classList.contains("is-large")).toBe(true);

    fakeAppCore.dispatch({
      type: "SET_FEATURE_FLAGS" as never,
      payload: { ...PLUME_DEFAULTS.featureFlags, tracklistAlwaysLarge: false } as never,
    });

    expect(dropdownEl.classList.contains("is-large")).toBe(false);
  });

  it("stops reacting to feature flag changes after cleanup", () => {
    const { dropdownEl, cleanup } = setup();
    cleanup();

    fakeAppCore.dispatch({
      type: "SET_FEATURE_FLAGS" as never,
      payload: { ...PLUME_DEFAULTS.featureFlags, tracklistAlwaysLarge: true } as never,
    });

    expect(dropdownEl.classList.contains("is-large")).toBe(false);
  });
});

describe("scroll centering on open", () => {
  let scrollToSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fakeAppCore = new FakeAppCore({ trackTitle: "Track A" });
    scrollToSpy = vi.spyOn(window.HTMLElement.prototype, "scrollTo");
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

  it("scrolls to top after open transition when active track is at edge (index 0)", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    fireTransitionEnd(dropdownEl);
    // Track A is index 0 → edge → scrollTo top: 0
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("does not scroll for unrelated CSS transitions", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    scrollToSpy.mockClear();
    fireTransitionEnd(dropdownEl, "opacity");
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it("recenters after mouseleave once the max-height transition completes", () => {
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    scrollToSpy.mockClear();
    dropdownEl.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
    // No scroll yet — waiting for the shrink transition
    expect(scrollToSpy).not.toHaveBeenCalled();
    fireTransitionEnd(dropdownEl);
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("does not recenter on mouseleave when closed", () => {
    const { dropdownEl } = setup();
    dropdownEl.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
    fireTransitionEnd(dropdownEl);
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it("recenters immediately on mouseleave when tracklistAlwaysLarge is on (no shrink transition to wait for)", () => {
    fakeAppCore = new FakeAppCore({
      trackTitle: "Track A",
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, tracklistAlwaysLarge: true },
    });
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    scrollToSpy.mockClear();

    dropdownEl.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));

    // Recenters right away — the dropdown never shrinks in this mode, so there's no
    // "max-height" transitionend to wait for.
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("does not register a transitionend listener for mouseleave when tracklistAlwaysLarge is on", () => {
    fakeAppCore = new FakeAppCore({
      trackTitle: "Track A",
      featureFlags: { ...PLUME_DEFAULTS.featureFlags, tracklistAlwaysLarge: true },
    });
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    fireTransitionEnd(dropdownEl); // consume the one-time "open" transitionend listener
    dropdownEl.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
    scrollToSpy.mockClear();

    // No listener left to consume — a stray transitionend must not trigger another recenter.
    fireTransitionEnd(dropdownEl);

    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it("does not scroll when no active item is present", () => {
    fakeAppCore = new FakeAppCore({ trackTitle: null });
    const { toggleBtn, dropdownEl } = setup();
    toggleBtn.click();
    scrollToSpy.mockClear();
    fireTransitionEnd(dropdownEl);
    expect(scrollToSpy).not.toHaveBeenCalled();
  });
});
