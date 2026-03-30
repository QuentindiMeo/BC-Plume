import { PLUME_LANGUAGE_AUTO } from "@/domain/plume";
import { createTabsMessageSender } from "@/infra/adapters";
import { createSettingsPanel } from "@/popup/components/SettingsPanel";
import { loadForcedLanguage } from "@/popup/use-cases/loadForcedLanguage";
import { loadHotkeys } from "@/popup/use-cases/loadHotkeys";
import { loadSeekJumpDuration } from "@/popup/use-cases/loadSeekJumpDuration";
import { loadTrackRestartThreshold } from "@/popup/use-cases/loadTrackRestartThreshold";
import { loadVolumeHotkeyStep } from "@/popup/use-cases/loadVolumeHotkeyStep";
import { setForcedLanguage } from "@/shared/i18n";

(async () => {
  const [forcedLanguage, seekJumpDuration, volumeHotkeyStep, trackRestartThreshold, hotkeyBindings] = await Promise.all(
    [loadForcedLanguage(), loadSeekJumpDuration(), loadVolumeHotkeyStep(), loadTrackRestartThreshold(), loadHotkeys()]
  );

  setForcedLanguage(forcedLanguage ?? PLUME_LANGUAGE_AUTO);

  const messageSender = createTabsMessageSender();

  const storedSettings = { forcedLanguage, seekJumpDuration, volumeHotkeyStep, trackRestartThreshold, hotkeyBindings };
  const settingsPanel = createSettingsPanel(storedSettings, messageSender);

  settingsPanel.mount(document.getElementById("app")!);
})();
