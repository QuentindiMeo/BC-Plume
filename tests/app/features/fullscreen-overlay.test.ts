// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeAppCore } from "../../fakes/FakeAppCore";

let fakeAppCore = new FakeAppCore();
let guiState: Record<string, unknown>;
let releaseDate: string | null = "12 Apr 2019 00:00:00 GMT";
let artworkUrl: string | null = "https://f4.bcbits.com/img/a123_10.jpg";
let infoSection: HTMLDivElement | null = null;

const guiDispatch = vi.fn();

vi.mock("@/app/stores/AppCoreImpl", () => ({ getAppCoreInstance: () => fakeAppCore }));
vi.mock("@/app/stores/GuiImpl", () => ({
  getGuiInstance: () => ({ getState: () => guiState, dispatch: guiDispatch }),
}));
vi.mock("@/app/stores/adapters", () => ({
  getBcPlayerInstance: () => ({
    getArtworkUrl: () => artworkUrl,
    getInfoSection: () => infoSection,
    getReleaseDate: () => releaseDate,
    getCurrentTrackUrl: () => "/track/some-track",
  }),
  getMusicPlayerInstance: () => ({}),
}));
vi.mock("@/app/features/track-title", () => ({ getAppropriateAccentColor: () => "rgb(1, 2, 3)" }));
vi.mock("@/app/features/ui/bpm-display", () => ({ syncBpmDisplay: vi.fn(), wireDetectAllBpmButton: vi.fn() }));
vi.mock("@/app/features/ui/loop", () => ({ applyLoopBtnState: vi.fn(), handleLoopCycle: vi.fn() }));
vi.mock("@/app/features/ui/playback", () => ({
  applyPlaybackControlsSize: vi.fn(),
  handlePlayPause: vi.fn(),
  handleSpeedCycle: vi.fn(),
  handleSpeedSlider: vi.fn(),
  handleSpeedSliderKeydown: vi.fn(),
  handleTimeBackward: vi.fn(),
  handleTimeForward: vi.fn(),
  handleTrackBackward: vi.fn(),
  handleTrackForward: vi.fn(),
  setupSpeedLabelClickBehavior: () => vi.fn(),
  setupSpeedPopoverBehavior: () => vi.fn(),
}));
vi.mock("@/app/features/ui/toast", () => ({ createToast: vi.fn() }));
vi.mock("@/app/features/ui/tracklist", () => ({
  createTracklistToggle: () => ({
    toggleBtn: document.createElement("button"),
    dropdownEl: document.createElement("div"),
    cleanup: vi.fn(),
  }),
}));
vi.mock("@/app/features/ui/volume", () => ({ handleMuteToggle: vi.fn() }));
vi.mock("@/app/features/ui/waveform", () => ({
  attachWaveformSeekHandler: vi.fn(),
  clearWaveform: vi.fn(),
  triggerWaveformDecode: vi.fn(),
}));
vi.mock("@/app/use-cases", () => ({
  runVisualizer: vi.fn(),
  seekToProgress: vi.fn(),
  setVolume: vi.fn(),
  stopVisualizer: vi.fn(),
  syncVisualizerWithPlayback: vi.fn(),
  toggleDurationDisplay: vi.fn(),
}));
vi.mock("@/shared/logger", () => ({
  CPL: { DEBUG: "debug", INFO: "info", WARN: "warn", ERROR: "error" },
  logger: vi.fn(),
}));
vi.mock("@/shared/svg", () => ({
  setSvgContent: vi.fn(),
  createSafeSvgElement: () => document.createElementNS("http://www.w3.org/2000/svg", "svg"),
}));
vi.mock("@/svg/icons", () => ({ PLUME_SVG: new Proxy({}, { get: () => "" }) }));

import { toggleFullscreenMode } from "@/app/features/fullscreen";
import { PLUME_ELEM_SELECTORS } from "@/infra/elements/plume";

const idOf = (selector: PLUME_ELEM_SELECTORS): string => selector.split("#")[1] as string;
const RELEASE_DATE_ID = idOf(PLUME_ELEM_SELECTORS.fullscreenTitlingReleaseDate);
const TITLING_CLASS = PLUME_ELEM_SELECTORS.fullscreenTitlingContainer.split(".")[1] as string;

const withId = (tag: string, selector: PLUME_ELEM_SELECTORS): HTMLElement => {
  const el = document.createElement(tag);
  el.id = idOf(selector);
  return el;
};

// Bandcamp's #name-section: h2 (release title) + h3 (artist), which is what the overlay clones.
const buildInfoSection = (): HTMLDivElement => {
  const section = document.createElement("div");
  section.id = "name-section";

  const title = document.createElement("h2");
  title.textContent = "Some Release";
  section.appendChild(title);

  const artist = document.createElement("h3");
  artist.textContent = "Some Artist";
  section.appendChild(artist);

  return section;
};

// Minimal Plume panel: every element setupFullscreenUi() wires listeners on without a null guard.
const buildPlumeContainer = (): HTMLDivElement => {
  const container = withId("div", PLUME_ELEM_SELECTORS.plumeContainer) as HTMLDivElement;

  const header = withId("div", PLUME_ELEM_SELECTORS.headerContainer);
  header.appendChild(withId("span", PLUME_ELEM_SELECTORS.headerTitlePretext));
  header.appendChild(withId("a", PLUME_ELEM_SELECTORS.headerTrackLink));
  header.appendChild(withId("span", PLUME_ELEM_SELECTORS.headerTitle));
  header.appendChild(withId("button", PLUME_ELEM_SELECTORS.tracklistToggleBtn));
  container.appendChild(header);

  container.appendChild(withId("input", PLUME_ELEM_SELECTORS.progressSlider));
  container.appendChild(withId("span", PLUME_ELEM_SELECTORS.elapsedDisplay));
  container.appendChild(withId("button", PLUME_ELEM_SELECTORS.durationDisplay));
  container.appendChild(withId("button", PLUME_ELEM_SELECTORS.trackBwdBtn));
  container.appendChild(withId("button", PLUME_ELEM_SELECTORS.timeBwdBtn));
  container.appendChild(withId("button", PLUME_ELEM_SELECTORS.playPauseBtn));
  container.appendChild(withId("button", PLUME_ELEM_SELECTORS.timeFwdBtn));
  container.appendChild(withId("button", PLUME_ELEM_SELECTORS.trackFwdBtn));
  container.appendChild(withId("button", PLUME_ELEM_SELECTORS.muteBtn));
  container.appendChild(withId("input", PLUME_ELEM_SELECTORS.volumeSlider));
  container.appendChild(withId("div", PLUME_ELEM_SELECTORS.volumeValue));
  container.appendChild(withId("div", PLUME_ELEM_SELECTORS.fullscreenBtnContainer));

  return container;
};

const buildTitleDisplay = (): HTMLDivElement => {
  const titleDisplay = document.createElement("div");
  const title = document.createElement("span");
  title.textContent = "Some Track";
  titleDisplay.appendChild(title);
  return titleDisplay;
};

const enterFullscreen = (): HTMLElement => {
  toggleFullscreenMode();
  const overlay = document.querySelector<HTMLElement>(`#${idOf(PLUME_ELEM_SELECTORS.fullscreenOverlay)}`);
  expect(overlay).not.toBeNull();
  return overlay as HTMLElement;
};

beforeEach(() => {
  document.body.innerHTML = "";
  guiDispatch.mockClear();

  fakeAppCore = new FakeAppCore({ pageType: "album", trackTitle: "Some Track", trackNumber: "1" });
  releaseDate = "12 Apr 2019 00:00:00 GMT";
  artworkUrl = "https://f4.bcbits.com/img/a123_10.jpg";
  infoSection = buildInfoSection();

  const plumeContainer = buildPlumeContainer();
  document.body.appendChild(plumeContainer);

  guiState = {
    plumeContainer,
    titleDisplay: buildTitleDisplay(),
    speedBtns: [],
    playPauseBtns: [],
    trackFwdBtns: [],
    loopBtns: [],
    fullscreenOverlay: null,
  };
});

describe("buildFullscreenOverlay release date", () => {
  it("renders the release date inside the titling block when Bandcamp exposes one", () => {
    const overlay = enterFullscreen();

    const releaseDateEl = overlay.querySelector(`#${RELEASE_DATE_ID}`);
    expect(releaseDateEl).not.toBeNull();
    expect(releaseDateEl?.textContent).toBe("Released April 12, 2019");
    expect(releaseDateEl?.closest(`.${TITLING_CLASS}`)).not.toBeNull();
  });

  it("places the release date after the artist heading", () => {
    const overlay = enterFullscreen();

    const titling = overlay.querySelector(`.${TITLING_CLASS}`) as HTMLElement;
    expect(Array.from(titling.children).map((child) => child.tagName)).toEqual(["H2", "H3", "P"]);
  });

  it("omits the release date but still builds the overlay when none is available", () => {
    releaseDate = null;

    const overlay = enterFullscreen();

    expect(overlay.querySelector(`#${RELEASE_DATE_ID}`)).toBeNull();
    expect(overlay.querySelector(`#${idOf(PLUME_ELEM_SELECTORS.fullscreenCoverArt)}`)).not.toBeNull();
    expect(overlay.querySelector(`.${TITLING_CLASS}`)).not.toBeNull();
    expect(overlay.querySelector(`#${idOf(PLUME_ELEM_SELECTORS.fullscreenClone)}`)).not.toBeNull();
  });

  it("omits the release date when Bandcamp's value is not a parsable date", () => {
    releaseDate = "coming soon";

    const overlay = enterFullscreen();

    expect(overlay.querySelector(`#${RELEASE_DATE_ID}`)).toBeNull();
    expect(overlay.querySelector(`.${TITLING_CLASS}`)).not.toBeNull();
  });

  it("does not build an overlay at all when the info section is missing", () => {
    infoSection = null;

    toggleFullscreenMode();

    expect(document.querySelector(`#${idOf(PLUME_ELEM_SELECTORS.fullscreenOverlay)}`)).toBeNull();
    expect(document.querySelector(`#${RELEASE_DATE_ID}`)).toBeNull();
  });
});
