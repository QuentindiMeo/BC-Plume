import { createTabsMessageSender } from "@/infra/adapters";
import { createSettingsPanel } from "@/popup/components/SettingsPanel";
import { loadFeatureFlags } from "@/popup/use-cases/loadFeatureFlags";
import { loadForcedLanguage } from "@/popup/use-cases/loadForcedLanguage";
import { loadHotkeys } from "@/popup/use-cases/loadHotkeys";
import { loadSeekJumpDuration } from "@/popup/use-cases/loadSeekJumpDuration";
import { loadTrackRestartThreshold } from "@/popup/use-cases/loadTrackRestartThreshold";
import { loadTracklistDropdownHeight } from "@/popup/use-cases/loadTracklistDropdownHeight";
import { loadVolumeHotkeyStep } from "@/popup/use-cases/loadVolumeHotkeyStep";
import { getActiveLocale, setForcedLanguage } from "@/shared/i18n";

(async () => {
  const [
    forcedLanguage,
    tracklistDropdownHeight,
    trackRestartThreshold,
    seekJumpDuration,
    volumeHotkeyStep,
    hotkeyBindings,
    featureFlags,
  ] = await Promise.all([
    loadForcedLanguage(),
    loadTracklistDropdownHeight(),
    loadTrackRestartThreshold(),
    loadSeekJumpDuration(),
    loadVolumeHotkeyStep(),
    loadHotkeys(),
    loadFeatureFlags(),
  ]);

  setForcedLanguage(forcedLanguage ?? null);
  document.documentElement.lang = getActiveLocale();

  const messageSender = createTabsMessageSender();

  const storedSettings = {
    forcedLanguage,
    tracklistDropdownHeight,
    trackRestartThreshold,
    seekJumpDuration,
    volumeHotkeyStep,
    hotkeyBindings,
    featureFlags,
  };
  const settingsPanel = createSettingsPanel(storedSettings, messageSender);

  const appEl = document.getElementById("app")!;
  settingsPanel.mount(appEl);
})();
