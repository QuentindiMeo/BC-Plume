import { WholeNumber } from "../../domain/plume";
import type { IMessageSender } from "../../domain/ports/messaging";
import { getString } from "../../shared/i18n";
import { createSafeSvgElement } from "../../shared/svg";
import { PLUME_SVG } from "../../svg/icons";
import { createHotkeyTab } from "./HotkeyTab";
import { createPlaybackTab } from "./PlaybackTab";
import { createTabBar, TabDefinition } from "./TabBar";

export type SettingsPanelInstance = { mount: (el: HTMLElement) => void };

export interface StoredSettings {
  hotkeyBindings: Parameters<typeof createHotkeyTab>[0];
  seekJumpDuration: WholeNumber | undefined;
  volumeHotkeyStep: WholeNumber | undefined;
  trackRestartThreshold: WholeNumber | undefined;
}

export const createSettingsPanel = (stored: StoredSettings, sender: IMessageSender): SettingsPanelInstance => {
  const buildHeader = (): HTMLElement => {
    const header = document.createElement("header");
    header.className = "popup__header";

    const logoWrap = document.createElement("span");
    logoWrap.className = "popup__header-logo";
    logoWrap.ariaHidden = "true";
    const logoSvg = createSafeSvgElement(PLUME_SVG.logo);
    if (logoSvg) logoWrap.appendChild(logoSvg);
    header.appendChild(logoWrap);

    const h1 = document.createElement("h1");
    h1.textContent = getString("POPUP_TITLE");
    header.appendChild(h1);

    const logoWrap2 = logoWrap.cloneNode(true) as HTMLElement; // duplicate for symmetrical design
    logoWrap2.style.visibility = "hidden"; // hide the second logo while keeping space for alignment
    header.appendChild(logoWrap2);
    return header;
  };

  const mount = (el: HTMLElement): void => {
    el.appendChild(buildHeader());

    const tabs: TabDefinition[] = [
      {
        id: "hotkeys",
        label: getString("POPUP__HOTKEYS__TAB_LABEL"),
        buildPanel: createHotkeyTab(stored.hotkeyBindings, sender),
      },
      {
        id: "playback",
        label: getString("POPUP__PLAYBACK__TAB_LABEL"),
        buildPanel: createPlaybackTab(
          stored.seekJumpDuration,
          stored.volumeHotkeyStep,
          stored.trackRestartThreshold,
          sender
        ),
      },
    ];
    el.appendChild(createTabBar(tabs).el);
  };

  return { mount };
};
