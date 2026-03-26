import type { IMessageSender } from "../../domain/ports/messaging";
import { getString } from "../../shared/i18n";
import { createHotkeyTab } from "./HotkeyTab";
import { createTabBar, TabDefinition } from "./TabBar";

export type SettingsPanelInstance = { mount: (el: HTMLElement) => void };

export const createSettingsPanel = (
  storedBindings: Parameters<typeof createHotkeyTab>[0],
  sender: IMessageSender
): SettingsPanelInstance => {
  const buildHeader = (): HTMLElement => {
    const header = document.createElement("header");
    header.className = "popup__header";

    const h1 = document.createElement("h1");
    h1.textContent = getString("POPUPTITLE");
    header.appendChild(h1);

    return header;
  };

  const mount = (el: HTMLElement): void => {
    el.appendChild(buildHeader());

    const tabs: TabDefinition[] = [
      {
        id: "hotkeys",
        label: getString("POPUP__HOTKEYS__TAB_LABEL"),
        buildPanel: createHotkeyTab(storedBindings, sender),
      },
    ];
    el.appendChild(createTabBar(tabs).el);
  };

  return { mount };
};
