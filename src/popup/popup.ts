import { createTabsMessageSender } from "@/infra/adapters";
import { createSettingsPanel } from "@/popup/components/SettingsPanel";
import { loadHotkeys } from "@/popup/use-cases/loadHotkeys";
import { loadSeekJumpDuration } from "@/popup/use-cases/loadSeekJumpDuration";
import { loadTrackRestartThreshold } from "@/popup/use-cases/loadTrackRestartThreshold";
import { loadVolumeHotkeyStep } from "@/popup/use-cases/loadVolumeHotkeyStep";

(async () => {
  const [hotkeyBindings, seekJumpDuration, volumeHotkeyStep, trackRestartThreshold] = await Promise.all([
    loadHotkeys(),
    loadSeekJumpDuration(),
    loadVolumeHotkeyStep(),
    loadTrackRestartThreshold(),
  ]);

  const messageSender = createTabsMessageSender();

  const storedSettings = { hotkeyBindings, seekJumpDuration, volumeHotkeyStep, trackRestartThreshold };
  const settingsPanel = createSettingsPanel(storedSettings, messageSender);

  settingsPanel.mount(document.getElementById("app")!);
})();
