// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/popup/use-cases/saveHotkeys", () => ({ saveHotkeys: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/popup/use-cases/resetHotkeys", () => ({ resetHotkeys: vi.fn().mockResolvedValue(undefined) }));

import { createHotkeyTab } from "@/popup/components/HotkeyTab";
import { saveHotkeys } from "@/popup/use-cases/saveHotkeys";
import { FakeMessageSender } from "../../fakes/FakeMessageSender";

const buildPanel = (): HTMLDivElement => {
  const panel = createHotkeyTab(undefined, new FakeMessageSender())();
  document.body.appendChild(panel); // focus restoration only observable on connected elements
  return panel;
};

const getResetBtn = (panel: HTMLDivElement): HTMLButtonElement =>
  panel.querySelector<HTMLButtonElement>(
    ".popup__reset-btn:not(.popup__reset-btn--cancel):not(.popup__reset-btn--confirm)"
  )!;

const getCancelBtn = (panel: HTMLDivElement): HTMLButtonElement =>
  panel.querySelector<HTMLButtonElement>(".popup__reset-btn--cancel")!;

const getConfirmBtn = (panel: HTMLDivElement): HTMLButtonElement =>
  panel.querySelector<HTMLButtonElement>(".popup__reset-btn--confirm")!;

beforeEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

describe("hotkeys reset flow — focus restoration", () => {
  it("cancel restores focus to the reset button before hiding the confirm controls", () => {
    const panel = buildPanel();
    const resetBtn = getResetBtn(panel);
    resetBtn.click();

    const cancelBtn = getCancelBtn(panel);
    expect(document.activeElement).toBe(getConfirmBtn(panel)); // opening focuses the confirm button

    cancelBtn.click();

    expect(resetBtn.hidden).toBe(false);
    expect(getCancelBtn(panel).hidden).toBe(true);
    expect(getConfirmBtn(panel).hidden).toBe(true);
    expect(document.activeElement).toBe(resetBtn);
  });

  it("confirming the reset restores focus to the reset button after resetHotkeys resolves", async () => {
    const panel = buildPanel();
    const resetBtn = getResetBtn(panel);
    resetBtn.click();

    const confirmBtn = getConfirmBtn(panel);
    confirmBtn.click();
    await vi.waitFor(() => expect(resetBtn.hidden).toBe(false));

    expect(getCancelBtn(panel).hidden).toBe(true);
    expect(confirmBtn.hidden).toBe(true);
    expect(document.activeElement).toBe(resetBtn);
  });
});

const flushFrame = () => new Promise<void>((resolve) => setTimeout(resolve, 20));

describe("reset confirmation", () => {
  it("reveals the reset-confirm text before writing it, one frame apart", async () => {
    const panel = buildPanel();
    const resetBtn = getResetBtn(panel);
    const confirmText = panel.querySelector<HTMLElement>(".popup__reset-confirm-text")!;
    expect(confirmText.hidden).toBe(true);

    resetBtn.click();

    expect(confirmText.hidden).toBe(false);
    expect(confirmText.textContent).toBe(""); // not yet written — deferred to the next frame

    await flushFrame();
    expect(confirmText.textContent).toBe("LABEL__TAB__RESET?");
  });

  it("reveals the save-persistence error before writing it, one frame apart", async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(saveHotkeys).mockRejectedValueOnce(new Error("persistence failed"));

      const panel = buildPanel();
      const remapBtn = panel.querySelectorAll<HTMLButtonElement>(".setting-row__btn")[0];
      const saveError = panel.querySelector<HTMLElement>(".general-row__error")!;
      expect(saveError.hidden).toBe(true);

      remapBtn.click(); // ? starts capture on the first hotkey row (PLAY_PAUSE)
      document.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyQ", key: "q", bubbles: true }));

      // ? Let the rejected saveHotkeys promise's .catch() run (a microtask) without advancing
      // ? fake timers yet, so the deferred rAF text write has not fired.
      await Promise.resolve();
      await Promise.resolve();

      expect(saveError.hidden).toBe(false);
      expect(saveError.textContent).toBe("");

      await vi.advanceTimersByTimeAsync(20);
      expect(saveError.textContent).toBe("ERROR__HOTKEYS__PERSISTENCE");
    } finally {
      vi.useRealTimers();
    }
  });
});
