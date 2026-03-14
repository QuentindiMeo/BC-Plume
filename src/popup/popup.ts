import { createSettingsPanel } from "./components/SettingsPanel";
import { loadHotkeys } from "./use-cases/loadHotkeys";

(async () => {
  const storedBindings = await loadHotkeys();
  const settingsPanel = createSettingsPanel(storedBindings);
  settingsPanel.mount(document.getElementById("app")!);
})();
