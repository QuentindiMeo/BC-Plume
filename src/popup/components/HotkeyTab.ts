import { DEFAULT_HOTKEYS, HotkeyAction, KeyBinding, KeyBindingMap } from "../../domain/hotkeys";
import type { IMessageSender } from "../../domain/ports/messaging";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { resetHotkeys } from "../use-cases/resetHotkeys";
import { saveHotkeys } from "../use-cases/saveHotkeys";
import { createHotkeyRow, HotkeyRowInstance } from "./HotkeyRow";

const ACTION_ORDER: HotkeyAction[] = [
  HotkeyAction.PLAY_PAUSE,
  HotkeyAction.TIME_BACKWARD,
  HotkeyAction.TIME_FORWARD,
  HotkeyAction.VOLUME_UP,
  HotkeyAction.VOLUME_DOWN,
  HotkeyAction.TRACK_BACKWARD,
  HotkeyAction.TRACK_FORWARD,
  HotkeyAction.FULLSCREEN,
  HotkeyAction.MUTE,
  HotkeyAction.LOOP_CYCLE,
];

/**
 * Returns a buildPanel factory for the Hotkeys tab.
 * Call the returned function once to produce the tab panel element.
 */
export const createHotkeyTab = (
  storedBindings: KeyBindingMap | undefined,
  sender: IMessageSender
): (() => HTMLElement) => {
  const currentBindings = Object.fromEntries(
    ACTION_ORDER.map((action) => [action, storedBindings?.[action] ?? DEFAULT_HOTKEYS[action]])
  ) as Record<HotkeyAction, KeyBinding>;

  const rows = new Map<HotkeyAction, HotkeyRowInstance>();

  const clearBinding = (action: HotkeyAction): void => {
    const cleared: KeyBinding = { code: "", label: getString("POPUP__HOTKEYS__DISABLED") };
    currentBindings[action] = cleared;
    rows.get(action)?.updateBinding(cleared);
  };

  const handleBindingChange = (action: HotkeyAction, newBinding: KeyBinding): void => {
    currentBindings[action] = newBinding;
    saveHotkeys(currentBindings, sender).catch(() => {
      logger(CPL.ERROR, getString("ERROR__HOTKEYS__PERSISTENCE"));
      currentBindings[action] = storedBindings?.[action] ?? DEFAULT_HOTKEYS[action];
      rows.get(action)?.updateBinding(currentBindings[action]);
    });
  };

  const buildDigitSeekRow = (): HTMLDivElement => {
    const row = document.createElement("div");
    row.className = "hotkey-row";

    const label = document.createElement("span");
    label.className = "hotkey-row__label hotkey-row__label--info";
    label.textContent = getString("LABEL__HOTKEY__DIGIT_SEEK");

    const badge = document.createElement("span");
    badge.className = "hotkey-row__badge";
    badge.textContent = "0 – 9";
    badge.ariaLabel = getString("LABEL__HOTKEY__DIGIT_SEEK");

    row.appendChild(label);
    row.appendChild(badge);

    return row;
  };

  const buildSection = (): HTMLElement => {
    const section = document.createElement("section");
    section.className = "settings__section";
    section.ariaLabel = getString("POPUP__HOTKEYS__TAB_LABEL");

    for (const action of ACTION_ORDER) {
      const row = createHotkeyRow(
        action,
        currentBindings[action],
        () => currentBindings,
        (changedAction, newBinding) => handleBindingChange(changedAction, newBinding),
        (conflictingAction) => clearBinding(conflictingAction)
      );
      rows.set(action, row);
      section.appendChild(row.el);
    }

    section.appendChild(buildDigitSeekRow());

    return section;
  };

  const buildFooter = (): HTMLElement => {
    const footer = document.createElement("footer");
    footer.className = "popup__footer";

    const confirmText = document.createElement("span");
    confirmText.className = "popup__reset-confirm-text";
    confirmText.hidden = true;
    confirmText.ariaLive = "polite";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "popup__reset-btn popup__reset-btn--cancel";
    cancelBtn.textContent = getString("POPUP__HOTKEYS__CANCEL");
    cancelBtn.hidden = true;
    cancelBtn.addEventListener("click", () => {
      confirmText.hidden = true;
      cancelBtn.hidden = true;
      confirmResetBtn.hidden = true;
      resetBtn.hidden = false;
    });

    const confirmResetBtn = document.createElement("button");
    confirmResetBtn.className = "popup__reset-btn popup__reset-btn--confirm";
    confirmResetBtn.textContent = getString("POPUP__HOTKEYS__RESET_ALL");
    confirmResetBtn.hidden = true;
    confirmResetBtn.addEventListener("click", async () => {
      await resetHotkeys(sender);
      for (const action of ACTION_ORDER) {
        currentBindings[action] = DEFAULT_HOTKEYS[action];
        rows.get(action)?.updateBinding(DEFAULT_HOTKEYS[action]);
      }
      confirmText.hidden = true;
      cancelBtn.hidden = true;
      confirmResetBtn.hidden = true;
      resetBtn.hidden = false;
    });

    const resetBtn = document.createElement("button");
    resetBtn.className = "popup__reset-btn";
    resetBtn.textContent = getString("POPUP__HOTKEYS__RESET_ALL");
    resetBtn.addEventListener("click", () => {
      resetBtn.hidden = true;
      confirmText.textContent = getString("POPUP__HOTKEYS__RESET_ALL") + "?";
      confirmText.hidden = false;
      cancelBtn.hidden = false;
      confirmResetBtn.hidden = false;
      confirmResetBtn.focus();
    });

    footer.appendChild(confirmText);
    footer.appendChild(cancelBtn);
    footer.appendChild(confirmResetBtn);
    footer.appendChild(resetBtn);

    return footer;
  };

  return (): HTMLElement => {
    const wrapper = document.createElement("div");
    wrapper.appendChild(buildSection());
    wrapper.appendChild(buildFooter());
    return wrapper;
  };
};
