// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeAppCore } from "../../../fakes/FakeAppCore";

let fakeAppCore = new FakeAppCore({ pageType: "album" });

const fakeTrackAudioInfos = [
  { trackNumber: 1, trackUrl: "/track/song-one", audioStreamUrl: "https://t4.bcbits.com/a" },
  { trackNumber: 2, trackUrl: "/track/song-two", audioStreamUrl: "https://t4.bcbits.com/b" },
];

vi.mock("@/app/stores/AppCoreImpl", () => ({ getAppCoreInstance: () => fakeAppCore }));
vi.mock("@/app/stores/adapters", () => ({
  getTrackAudioInstance: () => ({
    getTrackAudioInfos: () => fakeTrackAudioInfos,
  }),
}));
vi.mock("@/app/use-cases/detect-bpm", () => ({ detectBpmForAllTracks: vi.fn() }));
vi.mock("@/shared/i18n", () => ({ getString: (k: string, args?: string[]) => (args ? `${k}:${args.join(",")}` : k) }));

import { createBpmDisplaySection, syncBpmDisplay, wireDetectAllBpmButton } from "@/app/features/ui/bpm-display";
import { detectBpmForAllTracks } from "@/app/use-cases/detect-bpm";
import { PLUME_ELEM_SELECTORS } from "@/infra/elements/plume";

describe("createBpmDisplaySection", () => {
  it("creates a container with label and value elements", () => {
    const section = createBpmDisplaySection(false);
    expect(section.id).toBe(PLUME_ELEM_SELECTORS.bpmContainer.split("#")[1]);
    expect(section.querySelector(`#${PLUME_ELEM_SELECTORS.bpmLabel.split("#")[1]}`)).not.toBeNull();
    expect(section.querySelector(`#${PLUME_ELEM_SELECTORS.bpmValue.split("#")[1]}`)).not.toBeNull();
  });

  it("includes detect-all button on album pages", () => {
    const section = createBpmDisplaySection(true);
    const btn = section.querySelector(`#${PLUME_ELEM_SELECTORS.bpmDetectAllBtn.split("#")[1]}`);
    expect(btn).not.toBeNull();
  });

  it("does not include detect-all button on single-track pages", () => {
    const section = createBpmDisplaySection(false);
    const btn = section.querySelector(`#${PLUME_ELEM_SELECTORS.bpmDetectAllBtn.split("#")[1]}`);
    expect(btn).toBeNull();
  });
});

describe("syncBpmDisplay", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    fakeAppCore = new FakeAppCore({ pageType: "album" });
    fakeAppCore.dispatch({
      type: "SET_TRACK_NUMBER" as never,
      payload: "currently playing (1/2)" as never,
    });

    const section = createBpmDisplaySection(true);
    document.body.appendChild(section);
  });

  const getValueEl = () => document.querySelector<HTMLElement>(`#${PLUME_ELEM_SELECTORS.bpmValue.split("#")[1]}`)!;

  it("shows dash when no BPM entry exists for current track", () => {
    syncBpmDisplay({});
    expect(getValueEl().textContent).toBe("—");
  });

  it("shows detecting state", () => {
    syncBpmDisplay({
      "/track/song-one": { bpm: null, loading: true, error: false },
    });
    const el = getValueEl();
    expect(el.textContent).toBe("LABEL__BPM__DETECTING");
    expect(el.classList.contains("detecting")).toBe(true);
  });

  it("shows error state", () => {
    syncBpmDisplay({
      "/track/song-one": { bpm: null, loading: false, error: true },
    });
    const el = getValueEl();
    expect(el.textContent).toBe("LABEL__BPM__ERROR");
    expect(el.classList.contains("error")).toBe(true);
  });

  it("shows BPM value", () => {
    syncBpmDisplay({
      "/track/song-one": { bpm: 128, loading: false, error: false },
    });
    expect(getValueEl().textContent).toBe("128");
  });

  it("adjusts BPM by playback speed", () => {
    fakeAppCore.dispatch({ type: "SET_PLAYBACK_SPEED" as never, payload: 1.5 as never });
    syncBpmDisplay({
      "/track/song-one": { bpm: 100, loading: false, error: false },
    });
    expect(getValueEl().textContent).toBe("150");
  });

  it("clears detecting/error classes on update", () => {
    syncBpmDisplay({ "/track/song-one": { bpm: null, loading: true, error: false } });
    expect(getValueEl().classList.contains("detecting")).toBe(true);

    syncBpmDisplay({ "/track/song-one": { bpm: 128, loading: false, error: false } });
    expect(getValueEl().classList.contains("detecting")).toBe(false);
    expect(getValueEl().classList.contains("error")).toBe(false);
  });

  it("resets ariaLabel to the generic display label when leaving success state", () => {
    syncBpmDisplay({ "/track/song-one": { bpm: 128, loading: false, error: false } });
    expect(getValueEl().ariaLabel).toBe("ARIA__BPM__BADGE:128");

    syncBpmDisplay({ "/track/song-one": { bpm: 128, loading: true, error: false } });
    expect(getValueEl().ariaLabel).toBe("ARIA__BPM__DISPLAY");
  });

  it("updates all BPM value elements in the document (main player + fullscreen clone)", () => {
    // Simulate fullscreen clone: a second section appended after the first
    const clone = createBpmDisplaySection(false);
    document.body.appendChild(clone);

    syncBpmDisplay({ "/track/song-one": { bpm: 140, loading: false, error: false } });

    const allValueEls = document.querySelectorAll<HTMLElement>(PLUME_ELEM_SELECTORS.bpmValue);
    expect(allValueEls).toHaveLength(2);
    allValueEls.forEach((el) => expect(el.textContent).toBe("140"));
  });
});

describe("wireDetectAllBpmButton", () => {
  let btn: HTMLButtonElement;
  let resolveFn: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    btn = document.createElement("button");
    resolveFn = () => {};
    (detectBpmForAllTracks as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise<void>((resolve) => {
        resolveFn = resolve;
      })
    );
    wireDetectAllBpmButton(btn);
  });

  it("triggers detectBpmForAllTracks on click", () => {
    btn.click();
    expect(detectBpmForAllTracks).toHaveBeenCalledOnce();
  });

  it("disables the button during detection", () => {
    btn.click();
    expect(btn.disabled).toBe(true);
  });

  it("re-enables the button after detection completes", async () => {
    btn.click();
    resolveFn();
    await Promise.resolve();
    expect(btn.disabled).toBe(false);
  });

  it("ignores clicks while already disabled", () => {
    btn.click();
    btn.click();
    expect(detectBpmForAllTracks).toHaveBeenCalledOnce();
  });
});

describe("syncBpmDisplay — tracklist badge aria attributes", () => {
  const BADGE_SEL = `.${PLUME_ELEM_SELECTORS.bpmBadge.split(".")[1]}`;

  const addTracklistItem = (index: number): void => {
    const item = document.createElement("div");
    item.className = PLUME_ELEM_SELECTORS.tracklistItem.split(".")[1];
    item.dataset["index"] = String(index);
    document.body.appendChild(item);
  };

  beforeEach(() => {
    document.body.innerHTML = "";
    fakeAppCore = new FakeAppCore({ pageType: "album" });
    document.body.appendChild(createBpmDisplaySection(true));
    addTracklistItem(0); // index 0 → trackNumber 1 → /track/song-one
  });

  const getBadge = () => document.querySelector<HTMLElement>(BADGE_SEL)!;

  it("exposes BPM badge to assistive tech when displaying a value", () => {
    syncBpmDisplay({ "/track/song-one": { bpm: 128, loading: false, error: false } });
    expect(getBadge().ariaHidden).toBe("false");
    expect(getBadge().ariaLabel).toBe("ARIA__BPM__BADGE:128");
  });

  it("resets ariaHidden and ariaLabel when transitioning from success to loading", () => {
    syncBpmDisplay({ "/track/song-one": { bpm: 128, loading: false, error: false } });
    syncBpmDisplay({ "/track/song-one": { bpm: 128, loading: true, error: false } });
    expect(getBadge().ariaHidden).toBe("true");
    expect(getBadge().ariaLabel).toBeNull();
  });

  it("resets ariaHidden and ariaLabel when transitioning from success to error", () => {
    syncBpmDisplay({ "/track/song-one": { bpm: 128, loading: false, error: false } });
    syncBpmDisplay({ "/track/song-one": { bpm: 128, loading: false, error: true } });
    expect(getBadge().ariaHidden).toBe("true");
    expect(getBadge().ariaLabel).toBeNull();
  });
});
