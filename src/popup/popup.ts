import { createTabsMessageSender } from "@/infra/adapters";
import { createSettingsPanel } from "@/popup/components/SettingsPanel";
import { loadFeatureFlags } from "@/popup/use-cases/loadFeatureFlags";
import { loadForcedLanguage } from "@/popup/use-cases/loadForcedLanguage";
import { loadHotkeys } from "@/popup/use-cases/loadHotkeys";
import { loadSeekJumpDuration } from "@/popup/use-cases/loadSeekJumpDuration";
import { loadTrackRestartThreshold } from "@/popup/use-cases/loadTrackRestartThreshold";
import { loadVolumeHotkeyStep } from "@/popup/use-cases/loadVolumeHotkeyStep";
import { setForcedLanguage } from "@/shared/i18n";

(async () => {
  const [forcedLanguage, seekJumpDuration, volumeHotkeyStep, trackRestartThreshold, hotkeyBindings, featureFlags] =
    await Promise.all([
      loadForcedLanguage(),
      loadSeekJumpDuration(),
      loadVolumeHotkeyStep(),
      loadTrackRestartThreshold(),
      loadHotkeys(),
      loadFeatureFlags(),
    ]);

  setForcedLanguage(forcedLanguage ?? null);

  const messageSender = createTabsMessageSender();

  const storedSettings = {
    forcedLanguage,
    seekJumpDuration,
    volumeHotkeyStep,
    trackRestartThreshold,
    hotkeyBindings,
    featureFlags,
  };
  const settingsPanel = createSettingsPanel(storedSettings, messageSender);

  const appEl = document.getElementById("app")!;
  settingsPanel.mount(appEl);
})();
