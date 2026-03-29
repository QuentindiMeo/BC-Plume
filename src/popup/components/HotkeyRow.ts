import { HotkeyAction, KeyBinding, KeyBindingMap } from "@/domain/hotkeys";
import { getString } from "@/shared/i18n";

// Codes that must never be captured as hotkeys
const FORBIDDEN_CODES = new Set(["Tab", "Escape", "F5", "F12"]);

// Pure modifier key codes — silently ignored during capture; modifiers are read from the final key event
const MODIFIER_CODES = new Set([
  "ControlLeft",
  "ControlRight",
  "ShiftLeft",
  "ShiftRight",
  "AltLeft",
  "AltRight",
  "MetaLeft",
  "MetaRight",
]);

const ARROW_SYMBOLS: Record<string, string> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
};

const getDisplayLabel = (binding: KeyBinding) =>
  Object.entries(ARROW_SYMBOLS).reduce((label, [code, sym]) => label.replace(code, sym), binding.label);

/** Builds a full hotkey label by prepending active modifier names to the key label. */
export const buildLabel = (ctrl: boolean, shift: boolean, alt: boolean, keyLabel: string): string => {
  const parts: string[] = [];
  if (ctrl) parts.push("Ctrl");
  if (shift) parts.push("Shift");
  if (alt) parts.push("Alt");
  parts.push(keyLabel);
  return parts.join("+");
};

/** Maps a KeyboardEvent to a human-readable single-key label (no modifier prefix). */
export const labelForKeyEvent = (e: Pick<KeyboardEvent, "code" | "key">): string => {
  if (ARROW_SYMBOLS[e.code]) return ARROW_SYMBOLS[e.code]!;
  if (e.key && e.key.length === 1 && e.key !== " ") return e.key.toUpperCase();
  if (e.code === "Space") return "Space";
  if (e.code.startsWith("Key")) return e.code.slice(3);
  if (e.code.startsWith("Digit")) return e.code.slice(5);
  if (e.code.startsWith("Numpad")) return `Num ${e.code.slice(6)}`;
  return e.code;
};

export type BindingChangeHandler = (action: HotkeyAction, newBinding: KeyBinding) => void;
export type ConflictClearHandler = (conflictingAction: HotkeyAction) => void;

export interface HotkeyRowInstance {
  el: HTMLDivElement;
  updateBinding: (binding: KeyBinding) => void;
}

export const createHotkeyRow = (
  action: HotkeyAction,
  binding: KeyBinding,
  allBindings: () => KeyBindingMap,
  onBindingChange: BindingChangeHandler,
  onConflictClear: ConflictClearHandler
): HotkeyRowInstance => {
  let currentBinding: KeyBinding = { ...binding };
  let isCapturing = false;
  let capturedCode: string | null = null;
  let capturedLabel: string | null = null;
  let capturedCtrl = false;
  let capturedShift = false;
  let capturedAlt = false;

  const root = document.createElement("div");
  root.className = "hotkey-row";
  root.role = "group";

  const label = document.createElement("span");
  label.className = "hotkey-row__label";
  label.textContent = getString(`LABEL__HOTKEY__${action}`);

  const value = document.createElement("div");
  value.className = "hotkey-row__value";

  const btn = document.createElement("button");
  btn.className = "hotkey-row__btn";

  const conflictContainer = document.createElement("div");
  conflictContainer.hidden = true;

  const liveRegion = document.createElement("span");
  liveRegion.className = "sr-live";
  liveRegion.ariaLive = "assertive";
  liveRegion.ariaAtomic = "true";

  const refreshBtn = (): void => {
    const displayLabel = getDisplayLabel(currentBinding);
    btn.textContent = displayLabel;
    btn.ariaLabel = getString("ARIA__HOTKEY_ROW__BUTTON", [getString(`LABEL__HOTKEY__${action}`), displayLabel]);
  };

  const cancelCapture = (): void => {
    isCapturing = false;
    capturedCode = null;
    capturedLabel = null;
    capturedCtrl = false;
    capturedShift = false;
    capturedAlt = false;
    btn.classList.remove("hotkey-row__btn--capturing");
    conflictContainer.hidden = true;
    conflictContainer.innerHTML = "";
    refreshBtn();
    liveRegion.textContent = "";
  };

  const applyCapture = (): void => {
    const newBinding: KeyBinding = {
      code: capturedCode!,
      label: buildLabel(capturedCtrl, capturedShift, capturedAlt, capturedLabel!),
      ...(capturedCtrl ? { ctrl: true } : {}),
      ...(capturedShift ? { shift: true } : {}),
      ...(capturedAlt ? { alt: true } : {}),
    };
    currentBinding = newBinding;
    isCapturing = false;
    capturedCode = null;
    capturedLabel = null;
    capturedCtrl = false;
    capturedShift = false;
    capturedAlt = false;
    conflictContainer.hidden = true;
    conflictContainer.innerHTML = "";
    btn.classList.remove("hotkey-row__btn--capturing");
    refreshBtn();
    liveRegion.textContent = "";
    onBindingChange(action, newBinding);
  };

  const showConflict = (conflictingAction: HotkeyAction): void => {
    conflictContainer.hidden = false;
    conflictContainer.innerHTML = "";

    const msg = document.createElement("span");
    msg.className = "hotkey-row__conflict-msg";
    msg.textContent = getString("WARN__HOTKEYS__CONFLICT", [getString(`LABEL__HOTKEY__${conflictingAction}`)]);

    const actions = document.createElement("div");
    actions.className = "hotkey-row__conflict-actions";

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "hotkey-row__conflict-btn hotkey-row__conflict-btn--confirm";
    confirmBtn.textContent = getString("POPUP__HOTKEYS__CONFIRM_CONFLICT");
    confirmBtn.addEventListener("click", () => {
      onConflictClear(conflictingAction);
      applyCapture();
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "hotkey-row__conflict-btn hotkey-row__conflict-btn--cancel";
    cancelBtn.textContent = getString("POPUP__HOTKEYS__CANCEL");
    cancelBtn.addEventListener("click", () => cancelCapture());

    actions.appendChild(confirmBtn);
    actions.appendChild(cancelBtn);

    const wrapper = document.createElement("div");
    wrapper.className = "hotkey-row__conflict";
    wrapper.appendChild(msg);
    wrapper.appendChild(actions);

    conflictContainer.appendChild(wrapper);

    btn.classList.remove("hotkey-row__btn--capturing");
    refreshBtn();
  };

  const evaluateCapture = (): void => {
    if (!capturedCode || !capturedLabel) return;

    const bindings = allBindings();
    const conflictingAction = (Object.keys(bindings) as HotkeyAction[]).find(
      (a) =>
        a !== action &&
        bindings[a]?.code === capturedCode &&
        !!bindings[a]?.ctrl === capturedCtrl &&
        !!bindings[a]?.shift === capturedShift &&
        !!bindings[a]?.alt === capturedAlt
    );

    if (conflictingAction) {
      showConflict(conflictingAction);
    } else {
      applyCapture();
    }
  };

  const startCapture = (): void => {
    if (isCapturing) return;
    isCapturing = true;
    capturedCode = null;
    capturedLabel = null;

    btn.classList.add("hotkey-row__btn--capturing");
    btn.textContent = getString("POPUP__HOTKEYS__PRESS_KEY");
    btn.ariaLabel = getString("ARIA__HOTKEY_ROW__CAPTURING", [getString(`LABEL__HOTKEY__${action}`)]);
    liveRegion.textContent = getString("ARIA__HOTKEY_ROW__CAPTURING", [getString(`LABEL__HOTKEY__${action}`)]);

    const onKeydown = (e: KeyboardEvent) => {
      // Pure modifier key — wait for the actual key; modifiers will be read from its event.
      if (MODIFIER_CODES.has(e.code)) return;

      // Forbidden navigation keys (e.g. Tab, F5, F12) cancel capture without blocking their default browser behavior.
      if (FORBIDDEN_CODES.has(e.code) && e.code !== "Escape") {
        cancelCapture();
        document.removeEventListener("keydown", onKeydown, true);
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      if (e.code === "Escape") {
        cancelCapture();
        document.removeEventListener("keydown", onKeydown, true);
        return;
      }

      if (FORBIDDEN_CODES.has(e.code)) return;

      capturedCtrl = e.ctrlKey;
      capturedShift = e.shiftKey;
      capturedAlt = e.altKey;
      capturedCode = e.code;
      capturedLabel = labelForKeyEvent(e);
      document.removeEventListener("keydown", onKeydown, true);
      evaluateCapture();
    };

    document.addEventListener("keydown", onKeydown, true);
  };

  refreshBtn();
  btn.addEventListener("click", () => startCapture());

  value.appendChild(btn);
  value.appendChild(conflictContainer);

  root.appendChild(label);
  root.appendChild(value);
  root.appendChild(liveRegion);

  const updateBinding = (newBinding: KeyBinding): void => {
    currentBinding = { ...newBinding };
    if (!isCapturing) refreshBtn();
  };

  return { el: root, updateBinding };
};
