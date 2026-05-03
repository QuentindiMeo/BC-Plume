import { FeatureFlagKey, FeatureFlags, PLUME_DEFAULTS } from "@/domain/plume";
import type { IMessageSender } from "@/domain/ports/messaging";
import type { TabDefinition } from "@/popup/components/TabBar";
import { saveFeatureFlags } from "@/popup/use-cases/saveFeatureFlags";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

interface ToggleRowConfig {
  flagKey: FeatureFlagKey;
  labelKey: string;
}

const FLAG_ORDER: ToggleRowConfig[] = [
  { flagKey: "runtime", labelKey: "LABEL__FEATURES__RUNTIME" },
  { flagKey: "goToTrack", labelKey: "LABEL__FEATURES__GO_TO_TRACK" },
  { flagKey: "tracklist", labelKey: "LABEL__FEATURES__TRACKLIST" },
  { flagKey: "quickSeek", labelKey: "LABEL__FEATURES__QUICK_SEEK" },
  { flagKey: "speedControl", labelKey: "LABEL__FEATURES__SPEED_CONTROL" },
  { flagKey: "loopModes", labelKey: "LABEL__FEATURES__LOOP_MODES" },
  { flagKey: "fullscreen", labelKey: "LABEL__FEATURES__FULLSCREEN" },
  { flagKey: "visualizer", labelKey: "LABEL__FEATURES__VISUALIZER" },
  { flagKey: "bpmDetect", labelKey: "LABEL__FEATURES__BPM_DETECT" },
] as const;

const areAllDefaults = (flags: FeatureFlags): boolean =>
  FLAG_ORDER.every(({ flagKey }) => flags[flagKey] === PLUME_DEFAULTS.featureFlags[flagKey]);

export const createFeatureTab = (storedFlags: FeatureFlags, sender: IMessageSender): TabDefinition["buildPanel"] => {
  const currentFlags: FeatureFlags = { ...storedFlags };
  const toggleBtns = new Map<FeatureFlagKey, HTMLButtonElement>();

  let resetBtn: HTMLButtonElement | null = null;

  const syncResetVisibility = (): void => {
    if (resetBtn) resetBtn.hidden = areAllDefaults(currentFlags);
  };

  const persist = (flags: FeatureFlags): void => {
    saveFeatureFlags(flags, sender).catch(() => {
      logger(CPL.ERROR, getString("ERROR__FEATURE_FLAGS__PERSISTENCE"));
    });
  };

  const buildToggleRow = (config: ToggleRowConfig): HTMLElement => {
    const { flagKey, labelKey } = config;

    const row = document.createElement("div");
    row.className = "setting-row";

    const label = document.createElement("span");
    label.className = "setting-row__label";
    label.textContent = getString(labelKey);
    label.id = `feature-label-${flagKey}`;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.role = "switch";
    toggle.className = "feature-toggle";
    toggle.ariaChecked = String(currentFlags[flagKey]);
    toggle.setAttribute("aria-labelledby", label.id);

    const thumb = document.createElement("span");
    thumb.className = "feature-toggle__thumb";
    thumb.ariaHidden = "true";
    toggle.appendChild(thumb);

    toggle.addEventListener("click", () => {
      currentFlags[flagKey] = !currentFlags[flagKey];
      toggle.ariaChecked = String(currentFlags[flagKey]);

      // visualizer requires bpmDetect: enforce the dependency in both directions
      if (flagKey === "visualizer" && currentFlags.visualizer) {
        currentFlags.bpmDetect = true;
        const bpmBtn = toggleBtns.get("bpmDetect");
        if (bpmBtn) bpmBtn.ariaChecked = "true";
      } else if (flagKey === "bpmDetect" && !currentFlags.bpmDetect) {
        currentFlags.visualizer = false;
        const vizBtn = toggleBtns.get("visualizer");
        if (vizBtn) vizBtn.ariaChecked = "false";
      }

      persist(currentFlags);
      syncResetVisibility();
    });

    toggleBtns.set(flagKey, toggle);

    row.appendChild(label);
    row.appendChild(toggle);

    return row;
  };

  const buildSection = (): HTMLElement => {
    const section = document.createElement("section");
    section.className = "settings__section";
    section.ariaLabel = getString("POPUP__FEATURES__TAB_LABEL");

    for (const config of FLAG_ORDER) section.appendChild(buildToggleRow(config));

    return section;
  };

  const buildFooter = (): HTMLElement => {
    const footer = document.createElement("footer");
    footer.className = "popup__footer";

    resetBtn = document.createElement("button");
    resetBtn.className = "popup__reset-btn";
    resetBtn.textContent = getString("LABEL__TAB__RESET");
    resetBtn.hidden = areAllDefaults(currentFlags);
    resetBtn.addEventListener("click", () => {
      Object.assign(currentFlags, PLUME_DEFAULTS.featureFlags);
      for (const [flagKey, btn] of toggleBtns) btn.ariaChecked = String(currentFlags[flagKey]);
      persist(currentFlags);
      syncResetVisibility();
    });

    footer.appendChild(resetBtn);

    return footer;
  };

  return (): HTMLDivElement => {
    const wrapper = document.createElement("div");
    wrapper.appendChild(buildSection());
    wrapper.appendChild(buildFooter());
    return wrapper;
  };
};
