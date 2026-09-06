// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/i18n", () => ({ getString: (k: string) => k }));
vi.mock("@/popup/use-cases/saveHotkeys", () => ({ saveHotkeys: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/popup/use-cases/resetHotkeys", () => ({ resetHotkeys: vi.fn().mockResolvedValue(undefined) }));

import { createHotkeyTab } from "@/popup/components/HotkeyTab";
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
