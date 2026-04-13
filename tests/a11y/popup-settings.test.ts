// @vitest-environment jsdom

import { PLUME_DEFAULTS } from "@/domain/plume";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeMessageSender } from "../fakes/FakeMessageSender";
import { AXE_TEST_TIMEOUT, checkA11y } from "./axe-helper";

vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/shared/logger", () => ({ CPL: { ERROR: "error", WARN: "warn" }, logger: vi.fn() }));
vi.mock("@/shared/svg", () => ({
  createSafeSvgElement: () => document.createElementNS("http://www.w3.org/2000/svg", "svg"),
}));
vi.mock("@/svg/icons", () => ({ PLUME_SVG: { logo: "" } }));

vi.mock("@/popup/use-cases/saveHotkeys", () => ({ saveHotkeys: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/popup/use-cases/resetHotkeys", () => ({ resetHotkeys: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/popup/use-cases/saveSeekJumpDuration", () => ({
  saveSeekJumpDuration: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/popup/use-cases/saveVolumeHotkeyStep", () => ({
  saveVolumeHotkeyStep: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/popup/use-cases/saveTrackRestartThreshold", () => ({
  saveTrackRestartThreshold: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/popup/use-cases/saveForcedLanguage", () => ({
  saveForcedLanguage: vi.fn().mockResolvedValue(undefined),
}));

let sender: FakeMessageSender;

beforeEach(() => {
  document.body.innerHTML = "";
  sender = new FakeMessageSender();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("popup accessibility", () => {
  describe("createTabBar", () => {
    it(
      "has no a11y violations with two tabs",
      async () => {
        const { createTabBar } = await import("@/popup/components/TabBar");
        const tabBar = createTabBar([
          { id: "alpha", label: "Alpha", buildPanel: () => document.createElement("div") },
          { id: "beta", label: "Beta", buildPanel: () => document.createElement("div") },
        ]);
        document.body.appendChild(tabBar.el);
        await checkA11y(tabBar.el);
      },
      AXE_TEST_TIMEOUT
    );

    it(
      "maintains valid ARIA after switching tabs",
      async () => {
        const { createTabBar } = await import("@/popup/components/TabBar");
        const tabBar = createTabBar([
          { id: "alpha", label: "Alpha", buildPanel: () => document.createElement("div") },
          { id: "beta", label: "Beta", buildPanel: () => document.createElement("div") },
        ]);
        document.body.appendChild(tabBar.el);
        tabBar.activate("beta");
        await checkA11y(tabBar.el);
      },
      AXE_TEST_TIMEOUT
    );

    it("tabs have proper ARIA relationships", async () => {
      const { createTabBar } = await import("@/popup/components/TabBar");
      const tabBar = createTabBar([
        { id: "t1", label: "Tab 1", buildPanel: () => document.createElement("div") },
        { id: "t2", label: "Tab 2", buildPanel: () => document.createElement("div") },
      ]);
      document.body.appendChild(tabBar.el);

      const tab1 = tabBar.el.querySelector("#tab-t1") as HTMLButtonElement;
      const panel1 = tabBar.el.querySelector("#tabpanel-t1") as HTMLDivElement;
      expect(tab1.getAttribute("aria-controls")).toBe("tabpanel-t1");
      expect(panel1.getAttribute("aria-labelledby")).toBe("tab-t1");
    });
  });

  describe("createHotkeyRow", () => {
    it(
      "has no a11y violations",
      async () => {
        const { HotkeyAction, DEFAULT_HOTKEYS } = await import("@/domain/hotkeys");
        const { createHotkeyRow } = await import("@/popup/components/HotkeyRow");

        const allBindings = { ...DEFAULT_HOTKEYS };
        const row = createHotkeyRow(
          HotkeyAction.PLAY_PAUSE,
          DEFAULT_HOTKEYS[HotkeyAction.PLAY_PAUSE],
          () => allBindings,
          vi.fn(),
          vi.fn()
        );
        document.body.appendChild(row.el);
        await checkA11y(row.el);
      },
      AXE_TEST_TIMEOUT
    );

    it("button has accessible name with action and binding", async () => {
      const { HotkeyAction, DEFAULT_HOTKEYS } = await import("@/domain/hotkeys");
      const { createHotkeyRow } = await import("@/popup/components/HotkeyRow");

      const row = createHotkeyRow(
        HotkeyAction.PLAY_PAUSE,
        DEFAULT_HOTKEYS[HotkeyAction.PLAY_PAUSE],
        () => ({ ...DEFAULT_HOTKEYS }),
        vi.fn(),
        vi.fn()
      );
      const btn = row.el.querySelector("button");
      expect(btn?.getAttribute("aria-label")).toBeTruthy();
    });

    it("live region has assertive aria-live", async () => {
      const { HotkeyAction, DEFAULT_HOTKEYS } = await import("@/domain/hotkeys");
      const { createHotkeyRow } = await import("@/popup/components/HotkeyRow");

      const row = createHotkeyRow(
        HotkeyAction.MUTE,
        DEFAULT_HOTKEYS[HotkeyAction.MUTE],
        () => ({ ...DEFAULT_HOTKEYS }),
        vi.fn(),
        vi.fn()
      );
      const live = row.el.querySelector("[aria-live]");
      expect(live?.getAttribute("aria-live")).toBe("assertive");
      expect(live?.getAttribute("aria-atomic")).toBe("true");
    });
  });

  describe("createGeneralTab", () => {
    it(
      "has no a11y violations",
      async () => {
        const { createGeneralTab } = await import("@/popup/components/GeneralTab");
        const buildPanel = createGeneralTab(undefined, undefined, undefined, undefined, sender);
        const panel = buildPanel();
        document.body.appendChild(panel);
        await checkA11y(panel);
      },
      AXE_TEST_TIMEOUT
    );

    it("numeric inputs have aria-describedby linked to error elements", async () => {
      const { createGeneralTab } = await import("@/popup/components/GeneralTab");
      const buildPanel = createGeneralTab(undefined, undefined, undefined, undefined, sender);
      const panel = buildPanel();
      document.body.appendChild(panel);

      const inputs = panel.querySelectorAll("input[type='number']");
      expect(inputs.length).toBeGreaterThanOrEqual(3);
      for (const input of inputs) {
        const describedBy = input.getAttribute("aria-describedby");
        expect(describedBy).toBeTruthy();
        const errorEl = panel.querySelector(`#${describedBy}`);
        expect(errorEl).not.toBeNull();
        expect(errorEl?.getAttribute("role")).toBe("alert");
      }
    });

    it("numeric inputs have aria-invalid=false by default", async () => {
      const { createGeneralTab } = await import("@/popup/components/GeneralTab");
      const buildPanel = createGeneralTab(undefined, undefined, undefined, undefined, sender);
      const panel = buildPanel();

      const inputs = panel.querySelectorAll("input[type='number']");
      for (const input of inputs) {
        expect(input.getAttribute("aria-invalid")).toBe("false");
      }
    });
  });

  describe("createSettingsPanel", () => {
    it(
      "full popup has no a11y violations",
      async () => {
        const { createSettingsPanel } = await import("@/popup/components/SettingsPanel");
        const container = document.createElement("div");
        const panel = createSettingsPanel(
          {
            forcedLanguage: undefined,
            seekJumpDuration: undefined,
            volumeHotkeyStep: undefined,
            trackRestartThreshold: undefined,
            hotkeyBindings: undefined,
            featureFlags: { ...PLUME_DEFAULTS.featureFlags },
          },
          sender
        );
        panel.mount(container);
        document.body.appendChild(container);
        await checkA11y(container);
      },
      AXE_TEST_TIMEOUT
    );

    it("header has h1 and decorative logo is hidden from assistive tech", async () => {
      const { createSettingsPanel } = await import("@/popup/components/SettingsPanel");
      const container = document.createElement("div");
      const panel = createSettingsPanel(
        {
          forcedLanguage: undefined,
          seekJumpDuration: undefined,
          volumeHotkeyStep: undefined,
          trackRestartThreshold: undefined,
          hotkeyBindings: undefined,
          featureFlags: { ...PLUME_DEFAULTS.featureFlags },
        },
        sender
      );
      panel.mount(container);

      expect(container.querySelector("h1")).not.toBeNull();
      const logoSpan = container.querySelector(".popup__header-logo");
      expect(logoSpan?.getAttribute("aria-hidden")).toBe("true");
    });
  });
});
