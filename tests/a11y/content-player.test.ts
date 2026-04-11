// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeAppCore } from "../fakes/FakeAppCore";
import { FakeMusicPlayer } from "../fakes/FakeMusicPlayer";
import { AXE_TEST_TIMEOUT, checkA11y } from "./axe-helper";

vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/shared/logger", () => ({ CPL: { DEBUG: "debug", WARN: "warn" }, logger: vi.fn() }));
vi.mock("@/shared/svg", () => ({
  setSvgContent: vi.fn(),
  createSafeSvgElement: () => document.createElementNS("http://www.w3.org/2000/svg", "svg"),
}));
vi.mock("@/svg/icons", () => ({
  PLUME_SVG: {
    trackBackward: "",
    timeBackward: "",
    playPlay: "",
    playPause: "",
    timeForward: "",
    trackForward: "",
    loopNone: "",
    loopCollection: "",
    loopTrack: "",
    volumeOn: "",
    volumeMuted: "",
    fullscreen: "",
  },
}));
vi.mock("@/infra/elements/plume", () => ({
  PLUME_ELEM_SELECTORS: {
    playbackControls: "div#bpe-playback-controls",
    trackBwdBtn: "button#bpe-track-bwd-btn",
    timeBwdBtn: "button#bpe-time-bwd-btn",
    playPauseBtn: "button#bpe-play-pause-btn",
    timeFwdBtn: "button#bpe-time-fwd-btn",
    trackFwdBtn: "button#bpe-track-fwd-btn",
    loopBtn: "button#bpe-loop-btn",
    volumeContainer: "div#bpe-volume-container",
    muteBtn: "button#bpe-mute-btn",
    volumeSlider: "input#bpe-volume-slider",
    volumeValue: "div#bpe-volume-value",
    progressContainer: "div#bpe-progress-container",
    progressSlider: "input#bpe-progress-slider",
    timeDisplay: "div#bpe-time-display",
    elapsedDisplay: "span#bpe-elapsed-display",
    durationDisplay: "button#bpe-duration-display",
    fullscreenBtn: "button#bpe-fullscreen-btn",
    fullscreenBtnLabel: "span#bpe-fullscreen-btn-label",
    fullscreenBtnContainer: "div#bpe-fullscreen-btn-container",
  },
}));

let fakeAppCore = new FakeAppCore();
const fakeMusicPlayer = new FakeMusicPlayer();

vi.mock("@/app/stores/AppCoreImpl", () => ({ getAppCoreInstance: () => fakeAppCore }));
vi.mock("@/app/stores/GuiImpl", () => ({
  getGuiInstance: () => ({
    getState: () => ({}),
    dispatch: vi.fn(),
  }),
}));
vi.mock("@/app/stores/adapters", () => ({
  getMusicPlayerInstance: () => fakeMusicPlayer,
  getBcPlayerInstance: () => ({}),
}));
vi.mock("@/domain/ports/plume-ui", async (importOriginal: () => Promise<Record<string, unknown>>) => {
  const actual = await importOriginal();
  return { ...actual };
});
vi.mock("@/app/use-cases", () => ({
  navigateTrackBackward: vi.fn(),
  navigateTrackForward: vi.fn(),
  seekBackward: vi.fn(),
  seekForward: vi.fn(),
  seekToProgress: vi.fn(),
  togglePlayback: vi.fn(),
  toggleDurationDisplay: vi.fn(),
}));
vi.mock("@/app/use-cases/set-volume", () => ({ setVolume: vi.fn() }));
vi.mock("@/app/use-cases/cycle-loop-mode", () => ({ cycleLoopMode: vi.fn() }));
vi.mock("@/app/features/ui/loop", () => ({
  applyLoopBtnState: vi.fn(),
  handleLoopCycle: vi.fn(),
}));

beforeEach(() => {
  document.body.innerHTML = "";
  fakeAppCore = new FakeAppCore();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("content-player accessibility", () => {
  describe("createPlaybackControlPanel", () => {
    it(
      "has no a11y violations",
      async () => {
        const { createPlaybackControlPanel } = await import("@/app/features/ui/playback");
        const panel = createPlaybackControlPanel();
        document.body.appendChild(panel);
        await checkA11y(panel);
      },
      AXE_TEST_TIMEOUT
    );

    it("all buttons have accessible names", async () => {
      const { createPlaybackControlPanel } = await import("@/app/features/ui/playback");
      const panel = createPlaybackControlPanel();
      document.body.appendChild(panel);

      const buttons = panel.querySelectorAll("button");
      expect(buttons.length).toBe(6);
      for (const btn of buttons) {
        expect(btn.getAttribute("aria-label")).toBeTruthy();
      }
    });
  });

  describe("createVolumeControlSection", () => {
    it(
      "has no a11y violations",
      async () => {
        const { createVolumeControlSection } = await import("@/app/features/ui/volume");
        const section = await createVolumeControlSection();
        expect(section).not.toBeNull();
        document.body.appendChild(section!);
        await checkA11y(section!);
      },
      AXE_TEST_TIMEOUT
    );

    it("mute button has aria-pressed", async () => {
      const { createVolumeControlSection } = await import("@/app/features/ui/volume");
      const section = await createVolumeControlSection();
      const muteBtn = section!.querySelector("button");
      expect(muteBtn?.getAttribute("aria-pressed")).toBe("false");
    });

    it("volume slider has aria-label", async () => {
      const { createVolumeControlSection } = await import("@/app/features/ui/volume");
      const section = await createVolumeControlSection();
      const slider = section!.querySelector("input[type='range']");
      expect(slider?.getAttribute("aria-label")).toBeTruthy();
    });
  });

  describe("createProgressBar", () => {
    it(
      "has no a11y violations",
      async () => {
        const { createProgressBar } = await import("@/app/features/ui/progress");
        const bar = createProgressBar();
        document.body.appendChild(bar);
        await checkA11y(bar);
      },
      AXE_TEST_TIMEOUT
    );

    it("progress slider has aria-label", async () => {
      const { createProgressBar } = await import("@/app/features/ui/progress");
      const bar = createProgressBar();
      const slider = bar.querySelector("input[type='range']");
      expect(slider?.getAttribute("aria-label")).toBeTruthy();
    });

    it("duration button has aria-label", async () => {
      const { createProgressBar } = await import("@/app/features/ui/progress");
      const bar = createProgressBar();
      const durationBtn = bar.querySelector("button");
      expect(durationBtn?.getAttribute("aria-label")).toBeTruthy();
    });
  });

  describe("createFullscreenButtonSection", () => {
    it(
      "has no a11y violations",
      async () => {
        const { createFullscreenButtonSection } = await import("@/app/features/ui/fullscreen-button");
        const section = createFullscreenButtonSection(() => {});
        document.body.appendChild(section);
        await checkA11y(section);
      },
      AXE_TEST_TIMEOUT
    );

    it("fullscreen button has accessible name", async () => {
      const { createFullscreenButtonSection } = await import("@/app/features/ui/fullscreen-button");
      const section = createFullscreenButtonSection(() => {});
      const btn = section.querySelector("button");
      expect(btn?.getAttribute("aria-label")).toBeTruthy();
    });
  });
});
