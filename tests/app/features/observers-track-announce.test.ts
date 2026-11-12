// @vitest-environment jsdom — happy-dom doesn't reflect the `ariaLive` IDL property to the aria-live attribute
import { beforeEach, describe, expect, it, vi } from "vitest";

let capturedUpdateTrackDisplay: (() => void) | undefined;
vi.mock("@/app/features/audio-events", () => ({
  setupAudioEventListeners: (handlers: { updateTrackDisplay: () => void }) => {
    capturedUpdateTrackDisplay = handlers.updateTrackDisplay;
    return vi.fn();
  },
}));
vi.mock("@/app/features/fullscreen", () => ({ cleanupFullscreenMode: vi.fn(), toggleFullscreenMode: vi.fn() }));
vi.mock("@/app/features/keyboard", () => ({ setupHotkeys: vi.fn() }));
vi.mock("@/app/features/marquee", () => ({ applyMarqueeText: vi.fn() }));
vi.mock("@/app/features/store-subscriptions", () => ({ setupStoreSubscriptions: vi.fn() }));
vi.mock("@/app/features/toast", () => ({ cleanupReleaseToast: vi.fn() }));
vi.mock("@/app/features/ui", () => ({
  handleMuteToggle: vi.fn(),
  handlePlayPause: vi.fn(),
  handleSpeedCycle: vi.fn(),
  handleTimeBackward: vi.fn(),
  handleTimeForward: vi.fn(),
  handleTrackBackward: vi.fn(),
  handleTrackForward: vi.fn(),
  setupPlayerStickiness: vi.fn(),
}));
vi.mock("@/app/features/ui/loop", () => ({ handleLoopCycle: vi.fn() }));
vi.mock("@/app/use-cases/navigate-track", () => ({ isLastTrackOfCollectionPlaying: () => false }));
vi.mock("@/shared/logger", () => ({ CPL: { INFO: "info", WARN: "warn", LOG: "log" }, logger: vi.fn() }));

let trackMetadata: { trackTitle: string; trackNumberText: string; current: number; total: number };
vi.mock("@/app/use-cases/update-track-metadata", () => ({ updateTrackMetadata: () => trackMetadata }));

let guiState: Record<string, unknown>;
vi.mock("@/app/stores/GuiImpl", () => ({ getGuiInstance: () => ({ getState: () => guiState, dispatch: vi.fn() }) }));

let appCoreState: Record<string, unknown>;
vi.mock("@/app/stores/AppCoreImpl", () => ({
  getAppCoreInstance: () => ({ getState: () => appCoreState, dispatch: vi.fn() }),
}));

vi.mock("@/app/stores/adapters", () => ({ getBcPlayerInstance: () => ({ getCurrentTrackUrl: () => "/track/some" }) }));

import { setupListeners } from "@/app/features/observers";
import { PLUME_ELEM_SELECTORS } from "@/infra/elements/plume";

const idOf = (selector: PLUME_ELEM_SELECTORS): string => selector.split("#")[1] as string;

const flushAnnounceFrame = () => new Promise<void>((resolve) => setTimeout(resolve, 50));

beforeEach(() => {
  document.body.innerHTML = "";
  capturedUpdateTrackDisplay = undefined;

  const titleDisplay = document.createElement("div");
  const headerCurrent = document.createElement("div");
  headerCurrent.id = idOf(PLUME_ELEM_SELECTORS.headerCurrent);
  const headerTitlePretext = document.createElement("span");
  headerTitlePretext.id = idOf(PLUME_ELEM_SELECTORS.headerTitlePretext);
  const headerTitle = document.createElement("span");
  headerTitle.id = idOf(PLUME_ELEM_SELECTORS.headerTitle);
  const headerTrackLink = document.createElement("a");
  headerTrackLink.id = idOf(PLUME_ELEM_SELECTORS.headerTrackLink);
  titleDisplay.append(headerCurrent, headerTitlePretext, headerTitle, headerTrackLink);

  guiState = { titleDisplay, hotkeyBindings: {} };
  appCoreState = { pageType: "track", hotkeyBindings: {} };

  setupListeners({
    audioEvents: null,
    storeSubscriptions: null,
    stickiness: null,
    tracklist: null,
    hotkeys: null,
    toast: null,
  });
});

describe("M1 — track changes are announced", () => {
  it("announces the new track via the shared live region when the track display updates", async () => {
    trackMetadata = { trackTitle: "Some Track", trackNumberText: "", current: 0, total: 0 };

    expect(capturedUpdateTrackDisplay).toBeTypeOf("function");
    capturedUpdateTrackDisplay!();
    await flushAnnounceFrame();

    const liveRegion = document.querySelector(".sr-live");
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.getAttribute("role")).toBe("status");
    expect(liveRegion?.getAttribute("aria-live")).toBe("polite");
    expect(liveRegion?.textContent).toBe("The track Some Track is currently playing");
  });

  it("re-announces on a subsequent track change, including back to the same title", async () => {
    trackMetadata = { trackTitle: "Track A", trackNumberText: "", current: 0, total: 0 };
    capturedUpdateTrackDisplay!();
    await flushAnnounceFrame();
    expect(document.querySelector(".sr-live")?.textContent).toBe("The track Track A is currently playing");

    trackMetadata = { trackTitle: "Track B", trackNumberText: "", current: 0, total: 0 };
    capturedUpdateTrackDisplay!();
    await flushAnnounceFrame();
    expect(document.querySelector(".sr-live")?.textContent).toBe("The track Track B is currently playing");
  });

  it("uses the collection-aware ARIA string with track position on album pages", async () => {
    appCoreState = { pageType: "album", hotkeyBindings: {} };
    trackMetadata = { trackTitle: "Some Track", trackNumberText: "", current: 3, total: 10 };

    capturedUpdateTrackDisplay!();
    await flushAnnounceFrame();

    expect(document.querySelector(".sr-live")?.textContent).toBe(
      "The track Some Track is currently playing (track 3 out of 10)"
    );
  });
});
