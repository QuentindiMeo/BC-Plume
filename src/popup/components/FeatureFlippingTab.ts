import { FeatureFlagKey, FeatureFlags, PLUME_CONSTANTS, PLUME_DEFAULTS } from "@/domain/plume";
import type { IMessageSender } from "@/domain/ports/messaging";
import type { TabDefinition } from "@/popup/components/TabBar";
import { saveFeatureFlags } from "@/popup/use-cases/saveFeatureFlags";
import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

type ToggleRowConfig =
  | {
      flagKey: FeatureFlagKey;
      labelKey: string;
      noticeKey?: undefined;
      noticeSubstitutions?: undefined;
    }
  | {
      flagKey: FeatureFlagKey;
      labelKey: string;
      noticeKey: string;
      noticeSubstitutions: string[];
    };

const FLAG_ORDER: ToggleRowConfig[] = [
  { flagKey: "runtime", labelKey: "LABEL__FEATURES__RUNTIME" },
  { flagKey: "goToTrack", labelKey: "LABEL__FEATURES__GO_TO_TRACK" },
  { flagKey: "tracklist", labelKey: "LABEL__FEATURES__TRACKLIST" },
  { flagKey: "tracklistExpandedByDefault", labelKey: "LABEL__FEATURES__TRACKLIST_EXPANDED_BY_DEFAULT" },
  { flagKey: "tracklistAlwaysLarge", labelKey: "LABEL__FEATURES__TRACKLIST_ALWAYS_LARGE" },
  { flagKey: "quickSeek", labelKey: "LABEL__FEATURES__QUICK_SEEK" },
  {
    flagKey: "waveform",
    labelKey: "LABEL__FEATURES__WAVEFORM",
    noticeKey: "LABEL__FEATURES__WAVEFORM__NOTICE",
    noticeSubstitutions: [String(PLUME_CONSTANTS.WAVEFORM_MAX_DURATION_SECONDS / 60)],
  },
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
  const noticeRefs = new Map<FeatureFlagKey, HTMLParagraphElement>();

  let resetBtn: HTMLButtonElement | null = null;

  const syncResetVisibility = (): void => {
    if (resetBtn) resetBtn.hidden = areAllDefaults(currentFlags);
  };

  const persist = (flags: FeatureFlags): void => {
    saveFeatureFlags(flags, sender).catch(() => {
      logger(CPL.ERROR, getString("ERROR__FEATURE_FLAGS__PERSISTENCE"));
    });
  };

  // tracklistExpandedByDefault and tracklistAlwaysLarge only make sense when tracklist itself is
  // enabled: force them off and lock their toggles whenever the parent flag is off.
  const TRACKLIST_DEPENDENT_FLAGS: readonly FeatureFlagKey[] = ["tracklistExpandedByDefault", "tracklistAlwaysLarge"];
  const syncTracklistDependentFlagsAvailability = (): void => {
    for (const depFlag of TRACKLIST_DEPENDENT_FLAGS) {
      const depBtn = toggleBtns.get(depFlag);
      if (!depBtn) continue;

      depBtn.disabled = !currentFlags.tracklist;
      depBtn.ariaDisabled = String(!currentFlags.tracklist);

      if (!currentFlags.tracklist && currentFlags[depFlag]) {
        currentFlags[depFlag] = false;
        depBtn.ariaChecked = "false";
      }
    }
  };

  const buildToggleRow = (config: ToggleRowConfig): HTMLElement => {
    const { flagKey, labelKey, noticeKey, noticeSubstitutions } = config;

    const row = document.createElement("div");
    row.className = "setting-row";

    const label = document.createElement("span");
    label.className = "setting-row__label";
    label.textContent = getString(labelKey);
    label.id = `feature-label-${flagKey}`;

    if (noticeKey) {
      const notice = document.createElement("p");
      notice.className = "setting-row__notice";
      notice.textContent = getString(noticeKey, noticeSubstitutions);
      notice.hidden = !currentFlags[flagKey];
      label.appendChild(notice);
      noticeRefs.set(flagKey, notice);
    }

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
      if (toggle.disabled) return;

      currentFlags[flagKey] = !currentFlags[flagKey];
      toggle.ariaChecked = String(currentFlags[flagKey]);

      const notice = noticeRefs.get(flagKey);
      if (notice) notice.hidden = !currentFlags[flagKey];

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

      // tracklist-dependent flags: keep them off and locked whenever tracklist itself is off
      if (flagKey === "tracklist") syncTracklistDependentFlagsAvailability();

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

    for (const flagConfig of FLAG_ORDER) {
      const flagToggleRow = buildToggleRow(flagConfig);
      section.appendChild(flagToggleRow);
    }

    syncTracklistDependentFlagsAvailability();

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
      for (const [flagKey, notice] of noticeRefs) notice.hidden = !currentFlags[flagKey];
      syncTracklistDependentFlagsAvailability();
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
