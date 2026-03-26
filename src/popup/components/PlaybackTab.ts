import {
  assertBoundedInteger,
  assertWholeNumber,
  PLUME_DEFAULTS,
  SEEK_JUMP_DURATION_MAX,
  SEEK_JUMP_DURATION_MIN,
  TRACK_RESTART_THRESHOLD_MAX,
  TRACK_RESTART_THRESHOLD_MIN,
  VOLUME_HOTKEY_STEP_MAX,
  VOLUME_HOTKEY_STEP_MIN,
  WholeNumber,
} from "../../domain/plume";
import type { IMessageSender } from "../../domain/ports/messaging";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { saveSeekJumpDuration } from "../use-cases/saveSeekJumpDuration";
import { saveTrackRestartThreshold } from "../use-cases/saveTrackRestartThreshold";
import { saveVolumeHotkeyStep } from "../use-cases/saveVolumeHotkeyStep";
import type { TabDefinition } from "./TabBar";

interface NumericRowConfig {
  labelKey: string;
  ariaKey: string;
  unitKey: string;
  min: WholeNumber;
  max: WholeNumber;
  defaultValue: WholeNumber;
  initialValue: WholeNumber;
  errorOutOfRangeKey: string;
  errorPersistenceKey: string;
  inputId: string;
  onSave: (value: WholeNumber) => Promise<void>;
}

const buildNumericRow = (config: NumericRowConfig): HTMLElement => {
  const {
    labelKey,
    ariaKey,
    unitKey,
    min,
    max,
    defaultValue,
    initialValue,
    errorOutOfRangeKey,
    errorPersistenceKey,
    inputId,
    onSave,
  } = config;

  let currentValue = initialValue;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const row = document.createElement("div");
  row.className = "hotkey-row";

  const label = document.createElement("span");
  label.className = "hotkey-row__label";
  label.textContent = getString(labelKey);

  const value = document.createElement("div");
  value.className = "hotkey-row__value";

  const inputRow = document.createElement("div");
  inputRow.className = "playback-row__input-row";

  const input = document.createElement("input");
  input.type = "number";
  input.className = "playback-row__input";
  input.min = String(min);
  input.max = String(max);
  input.value = String(currentValue);
  input.id = inputId;
  input.ariaLabel = getString(ariaKey);
  input.setAttribute("aria-describedby", `${inputId}-error`);
  input.ariaInvalid = "false";

  const unit = document.createElement("span");
  unit.className = "playback-row__unit";
  unit.textContent = getString(unitKey);
  unit.ariaHidden = "true";

  const error = document.createElement("span");
  error.className = "playback-row__error";
  error.id = `${inputId}-error`;
  error.role = "alert";
  error.hidden = true;

  const resetBtn = document.createElement("button");
  resetBtn.className = "playback-row__reset-link";
  resetBtn.textContent = getString("LABEL__PLAYBACK__RESET");
  resetBtn.hidden = currentValue === defaultValue;

  const validate = (raw: string): { valid: true; value: WholeNumber } | { valid: false; error: string } => {
    const num = raw ? Number(raw) : NaN;
    try {
      assertWholeNumber(num);
    } catch {
      return { valid: false, error: getString("ERROR__PLAYBACK__NOT_INTEGER") };
    }
    try {
      assertBoundedInteger(num, min, max);
    } catch {
      return { valid: false, error: getString(errorOutOfRangeKey) };
    }
    return { valid: true, value: num as WholeNumber };
  };

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

  const persist = (value: WholeNumber): void => {
    currentValue = value;
    resetBtn.hidden = value === defaultValue;
    onSave(value).catch(() => {
      logger(CPL.ERROR, getString(errorPersistenceKey));
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
  });

  resetBtn.addEventListener("click", () => {
    input.value = String(defaultValue);
    setError(null);
    if (debounceTimer) clearTimeout(debounceTimer);
    persist(defaultValue);
  });

  inputRow.appendChild(input);
  inputRow.appendChild(unit);

  value.appendChild(inputRow);
  value.appendChild(error);
  value.appendChild(resetBtn);

  row.appendChild(label);
  row.appendChild(value);

  return row;
};

/**
 * Returns a buildPanel factory for the Playback tab.
 * Call the returned function once to produce the tab panel element.
 */
export const createPlaybackTab = (
  storedSeekJumpDuration: WholeNumber | undefined,
  storedVolumeHotkeyStep: WholeNumber | undefined,
  storedTrackRestartThreshold: WholeNumber | undefined,
  sender: IMessageSender
): TabDefinition["buildPanel"] => {
  const buildSection = (): HTMLElement => {
    const section = document.createElement("section");
    section.className = "settings__section";
    section.ariaLabel = getString("POPUP__PLAYBACK__TAB_LABEL");

    const seekJumpRow = buildNumericRow({
      labelKey: "LABEL__PLAYBACK__SEEK_JUMP_DURATION",
      ariaKey: "ARIA__PLAYBACK__SEEK_JUMP_DURATION_INPUT",
      unitKey: "META__SECONDS_UNIT",
      min: SEEK_JUMP_DURATION_MIN,
      max: SEEK_JUMP_DURATION_MAX,
      defaultValue: PLUME_DEFAULTS.seekJumpDuration,
      initialValue: storedSeekJumpDuration ?? PLUME_DEFAULTS.seekJumpDuration,
      errorOutOfRangeKey: "ERROR__SEEK_JUMP_DURATION__OUT_OF_RANGE",
      errorPersistenceKey: "ERROR__SEEK_JUMP_DURATION__PERSISTENCE",
      inputId: "seek-jump-duration-input",
      onSave: (value) => saveSeekJumpDuration(value, sender),
    });
    const volumeStepRow = buildNumericRow({
      labelKey: "LABEL__PLAYBACK__VOLUME_HOTKEY_STEP",
      ariaKey: "ARIA__PLAYBACK__VOLUME_HOTKEY_STEP_INPUT",
      unitKey: "META__PERCENT_UNIT",
      min: VOLUME_HOTKEY_STEP_MIN,
      max: VOLUME_HOTKEY_STEP_MAX,
      defaultValue: PLUME_DEFAULTS.volumeHotkeyStep,
      initialValue: storedVolumeHotkeyStep ?? PLUME_DEFAULTS.volumeHotkeyStep,
      errorOutOfRangeKey: "ERROR__VOLUME_HOTKEY_STEP__OUT_OF_RANGE",
      errorPersistenceKey: "ERROR__VOLUME_HOTKEY_STEP__PERSISTENCE",
      inputId: "volume-step-input",
      onSave: (value) => saveVolumeHotkeyStep(value, sender),
    });
    const trackRestartRow = buildNumericRow({
      labelKey: "LABEL__PLAYBACK__TRACK_RESTART_THRESHOLD",
      ariaKey: "ARIA__PLAYBACK__TRACK_RESTART_THRESHOLD_INPUT",
      unitKey: "META__SECONDS_UNIT",
      min: TRACK_RESTART_THRESHOLD_MIN,
      max: TRACK_RESTART_THRESHOLD_MAX,
      defaultValue: PLUME_DEFAULTS.trackRestartThreshold,
      initialValue: storedTrackRestartThreshold ?? PLUME_DEFAULTS.trackRestartThreshold,
      errorOutOfRangeKey: "ERROR__TRACK_RESTART_THRESHOLD__OUT_OF_RANGE",
      errorPersistenceKey: "ERROR__TRACK_RESTART_THRESHOLD__PERSISTENCE",
      inputId: "track-restart-threshold-input",
      onSave: (value) => saveTrackRestartThreshold(value, sender),
    });

    section.appendChild(seekJumpRow);
    section.appendChild(volumeStepRow);
    section.appendChild(trackRestartRow);

    return section;
  };

  return (): HTMLDivElement => {
    const wrapper = document.createElement("div");
    wrapper.appendChild(buildSection());
    return wrapper;
  };
};
