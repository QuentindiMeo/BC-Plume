import { createTabsMessageSender } from "../infra/adapters";
import { createSettingsPanel } from "./components/SettingsPanel";
import { loadHotkeys } from "./use-cases/loadHotkeys";

(async () => {
  const messageSender = createTabsMessageSender();
  const storedBindings = await loadHotkeys();
  const settingsPanel = createSettingsPanel(storedBindings, messageSender);
  settingsPanel.mount(document.getElementById("app")!);
})();
