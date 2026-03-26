import { PLUME_DEFAULTS } from "../../domain/plume";
import type { IMessageSender } from "../../domain/ports/messaging";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { saveSeekDuration } from "../use-cases/saveSeekDuration";
import { TabDefinition } from "./TabBar";

const SEEK_DURATION_MIN = 1;
const SEEK_DURATION_MAX = 300;

/**
 * Returns a buildPanel factory for the Playback tab.
 * Call the returned function once to produce the tab panel element.
 */
export const createPlaybackTab = (
  storedSeekDuration: number | undefined,
  sender: IMessageSender
): TabDefinition["buildPanel"] => {
  let currentDuration = storedSeekDuration ?? PLUME_DEFAULTS.seekDuration;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const validate = (raw: string): { valid: true; value: number } | { valid: false; error: string } => {
    const num = Number(raw);
    if (!Number.isInteger(num) || raw.trim() === "")
      return { valid: false, error: getString("ERROR__SEEK_DURATION__NOT_INTEGER") };
    if (num < SEEK_DURATION_MIN || num > SEEK_DURATION_MAX)
      return { valid: false, error: getString("ERROR__SEEK_DURATION__OUT_OF_RANGE") };
    return { valid: true, value: num };
  };

  const buildSection = (): HTMLElement => {
    const section = document.createElement("section");
    section.className = "settings__section";
    section.ariaLabel = getString("POPUP__PLAYBACK__TAB_LABEL");

    const row = document.createElement("div");
    row.className = "hotkey-row";

    const label = document.createElement("span");
    label.className = "hotkey-row__label";
    label.textContent = getString("LABEL__PLAYBACK__SEEK_DURATION");

    const right = document.createElement("div");
    right.className = "hotkey-row__right";

    const inputRow = document.createElement("div");
    inputRow.className = "playback-row__input-row";

    const input = document.createElement("input");
    input.type = "number";
    input.className = "playback-row__input";
    input.min = String(SEEK_DURATION_MIN);
    input.max = String(SEEK_DURATION_MAX);
    input.value = String(currentDuration);
    input.id = "seek-duration-input";
    input.ariaLabel = getString("ARIA__PLAYBACK__SEEK_DURATION_INPUT");
    input.setAttribute("aria-describedby", "seek-duration-error");
    input.ariaInvalid = "false";

    const unit = document.createElement("span");
    unit.className = "playback-row__unit";
    unit.textContent = getString("META__SECONDS_UNIT");
    unit.ariaHidden = "true";

    const error = document.createElement("span");
    error.className = "playback-row__error";
    error.id = "seek-duration-error";
    error.role = "alert";
    error.hidden = true;

    const resetBtn = document.createElement("button");
    resetBtn.className = "playback-row__reset-link";
    resetBtn.textContent = getString("LABEL__PLAYBACK__SEEK_DURATION_RESET");
    resetBtn.hidden = currentDuration === PLUME_DEFAULTS.seekDuration;

    const setError = (msg: string | null): void => {
      if (msg) {
        error.textContent = msg;
        error.hidden = false;
        input.classList.add("is-invalid");
        input.ariaInvalid = "true";
      } else {
        error.hidden = true;
        error.textContent = "";
        input.classList.remove("is-invalid");
        input.ariaInvalid = "false";
      }
    };

    const persist = (value: number): void => {
      currentDuration = value;
      resetBtn.hidden = value === PLUME_DEFAULTS.seekDuration;
      saveSeekDuration(value, sender).catch(() => {
        logger(CPL.ERROR, getString("ERROR__SEEK_DURATION__PERSISTENCE"));
      });
    };

    input.addEventListener("input", () => {
      const result = validate(input.value);
      if (!result.valid) {
        setError(result.error);
        if (debounceTimer) clearTimeout(debounceTimer);
        return;
      }
      setError(null);
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        persist(result.value);
        debounceTimer = null;
      }, 700);
    });

    input.addEventListener("blur", () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      const result = validate(input.value);
      if (result.valid) {
        setError(null);
        persist(result.value);
      }
      // on invalid blur, keep the error shown; don't reset to previous value
    });

    resetBtn.addEventListener("click", () => {
      input.value = String(PLUME_DEFAULTS.seekDuration);
      setError(null);
      if (debounceTimer) clearTimeout(debounceTimer);
      persist(PLUME_DEFAULTS.seekDuration);
    });

    inputRow.appendChild(input);
    inputRow.appendChild(unit);

    right.appendChild(inputRow);
    right.appendChild(error);
    right.appendChild(resetBtn);

    row.appendChild(label);
    row.appendChild(right);
    section.appendChild(row);

    return section;
  };

  return (): HTMLDivElement => {
    const wrapper = document.createElement("div");
    wrapper.appendChild(buildSection());
    return wrapper;
  };
};
