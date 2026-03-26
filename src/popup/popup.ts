import { createTabsMessageSender } from "../infra/adapters";
import { createSettingsPanel } from "./components/SettingsPanel";
import { loadHotkeys } from "./use-cases/loadHotkeys";
import { loadSeekJumpDuration } from "./use-cases/loadSeekJumpDuration";
import { loadTrackRestartThreshold } from "./use-cases/loadTrackRestartThreshold";
import { loadVolumeHotkeyStep } from "./use-cases/loadVolumeHotkeyStep";

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
