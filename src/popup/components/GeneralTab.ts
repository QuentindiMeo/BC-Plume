import {
  assertBoundedInteger,
  assertWholeNumber,
  PLUME_DEFAULTS,
  PLUME_SUPPORTED_LANGUAGES,
  SEEK_JUMP_DURATION_MAX,
  SEEK_JUMP_DURATION_MIN,
  TRACK_RESTART_THRESHOLD_MAX,
  TRACK_RESTART_THRESHOLD_MIN,
  VOLUME_HOTKEY_STEP_MAX,
  VOLUME_HOTKEY_STEP_MIN,
  WholeNumber,
  type PlumeLanguage,
} from "@/domain/plume";
import type { IMessageSender } from "@/domain/ports/messaging";
import type { TabDefinition } from "@/popup/components/TabBar";
import { saveForcedLanguage } from "@/popup/use-cases/saveForcedLanguage";
import { saveSeekJumpDuration } from "@/popup/use-cases/saveSeekJumpDuration";
import { saveTrackRestartThreshold } from "@/popup/use-cases/saveTrackRestartThreshold";
import { saveVolumeHotkeyStep } from "@/popup/use-cases/saveVolumeHotkeyStep";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

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
  row.className = "setting-row";

  const label = document.createElement("span");
  label.className = "setting-row__label";
  label.textContent = getString(labelKey);

  const value = document.createElement("div");
  value.className = "setting-row__value";

  const inputRow = document.createElement("div");
  inputRow.className = "general-row__input-row";

  const input = document.createElement("input");
  input.type = "number";
  input.className = "general-row__input";
  input.min = String(min);
  input.max = String(max);
  input.value = String(currentValue);
  input.id = inputId;
  input.ariaLabel = getString(ariaKey);
  input.setAttribute("aria-describedby", `${inputId}-error`);
  input.ariaInvalid = "false";

  const unit = document.createElement("span");
  unit.className = "general-row__unit";
  unit.textContent = getString(unitKey);
  unit.ariaHidden = "true";

  const error = document.createElement("span");
  error.className = "general-row__error";
  error.id = `${inputId}-error`;
  error.role = "alert";
  error.hidden = true;

  const resetBtn = document.createElement("button");
  resetBtn.className = "general-row__reset-link";
  resetBtn.textContent = getString("LABEL__GENERAL__RESET");
  resetBtn.hidden = currentValue === defaultValue;

  const validate = (raw: string): { valid: true; value: WholeNumber } | { valid: false; error: string } => {
    const num = raw ? Number(raw) : NaN;
    try {
      assertWholeNumber(num);
    } catch {
      return { valid: false, error: getString("ERROR__GENERAL__NOT_INTEGER") };
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

interface SelectRowConfig<T extends string> {
  labelKey: string;
  ariaKey: string;
  options: Array<{ value: T; labelKey: string }>;
  defaultValue: T;
  initialValue: T;
  errorPersistenceKey: string;
  selectId: string;
  onSave: (value: T) => Promise<void>;
}

const buildSelectRow = <T extends string>(config: SelectRowConfig<T>): HTMLElement => {
  const { labelKey, ariaKey, options, defaultValue, initialValue, errorPersistenceKey, selectId, onSave } = config;

  const row = document.createElement("div");
  row.className = "setting-row";

  const label = document.createElement("span");
  label.className = "setting-row__label";
  label.textContent = getString(labelKey);

  const value = document.createElement("div");
  value.className = "setting-row__value";

  const inputRow = document.createElement("div");
  inputRow.className = "general-row__input-row";

  const select = document.createElement("select");
  select.className = "general-row__select";
  select.id = selectId;
  select.ariaLabel = getString(ariaKey);

  for (const opt of options) {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = getString(opt.labelKey);
    if (opt.value === initialValue) option.selected = true;
    select.appendChild(option);
  }

  const resetBtn = document.createElement("button");
  resetBtn.className = "general-row__reset-link";
  resetBtn.textContent = getString("LABEL__GENERAL__RESET");
  resetBtn.hidden = initialValue === defaultValue;

  select.addEventListener("change", () => {
    resetBtn.hidden = select.value === defaultValue;
    onSave(select.value as T).catch(() => {
      logger(CPL.ERROR, getString(errorPersistenceKey));
    });
  });

  resetBtn.addEventListener("click", () => {
    select.value = defaultValue;
    resetBtn.hidden = true;
    onSave(defaultValue).catch(() => {
      logger(CPL.ERROR, getString(errorPersistenceKey));
    });
  });

  inputRow.appendChild(select);
  value.appendChild(inputRow);
  value.appendChild(resetBtn);

  row.appendChild(label);
  row.appendChild(value);

  return row;
};

/**
 * Returns a buildPanel factory for the General tab.
 * Call the returned function once to produce the tab panel element.
 */
export const createGeneralTab = (
  storedSeekJumpDuration: WholeNumber | undefined,
  storedVolumeHotkeyStep: WholeNumber | undefined,
  storedTrackRestartThreshold: WholeNumber | undefined,
  storedForcedLanguage: PlumeLanguage | undefined,
  sender: IMessageSender
): TabDefinition["buildPanel"] => {
  const buildSection = (): HTMLElement => {
    const section = document.createElement("section");
    section.className = "settings__section";
    section.ariaLabel = getString("POPUP__GENERAL__TAB_LABEL");

    const refreshNotice = document.createElement("p");
    refreshNotice.className = "general-row__refresh-notice";
    refreshNotice.textContent = getString("INFO__GENERAL__LANGUAGE_REFRESH_REQUIRED");
    refreshNotice.hidden = true;

    const languageRow = buildSelectRow({
      labelKey: "LABEL__GENERAL__FORCED_LANGUAGE",
      ariaKey: "ARIA__GENERAL__FORCED_LANGUAGE_SELECT",
      options: PLUME_SUPPORTED_LANGUAGES.map((code) => ({
        value: code,
        labelKey: `LABEL__LANGUAGE__${code.toUpperCase()}`,
      })),
      defaultValue: PLUME_DEFAULTS.language,
      initialValue: storedForcedLanguage ?? PLUME_DEFAULTS.language,
      errorPersistenceKey: "ERROR__FORCED_LANGUAGE__PERSISTENCE",
      selectId: "forced-language-select",
      onSave: async (value) => {
        await saveForcedLanguage(value);
        refreshNotice.hidden = false;
      },
    });

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

    section.appendChild(refreshNotice);
    section.appendChild(languageRow);
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
