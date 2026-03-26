import { createTabsMessageSender } from "../infra/adapters";
import { createSettingsPanel } from "./components/SettingsPanel";
import { loadHotkeys } from "./use-cases/loadHotkeys";
import { loadSeekDuration } from "./use-cases/loadSeekDuration";

(async () => {
  const [hotkeyBindings, seekDuration] = await Promise.all([loadHotkeys(), loadSeekDuration()]);

  const messageSender = createTabsMessageSender();
  const settingsPanel = createSettingsPanel({ hotkeyBindings, seekDuration }, messageSender);

  settingsPanel.mount(document.getElementById("app")!);
})();
