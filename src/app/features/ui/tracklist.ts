import { getBcPlayerInstance } from "@/app/stores/adapters";
import { getAppCoreInstance } from "@/app/stores/AppCoreImpl";
import { navigateToTrack } from "@/app/use-cases";
import { PLUME_ELEM_SELECTORS } from "@/infra/elements/plume";
import { getString } from "@/shared/i18n";
import { setSvgContent } from "@/shared/svg";
import { PLUME_SVG } from "@/svg/icons";

const DROPDOWN_ID = PLUME_ELEM_SELECTORS.tracklistDropdown.split("#")[1];
const TOGGLE_BTN_ID = PLUME_ELEM_SELECTORS.tracklistToggleBtn.split("#")[1];
const ITEM_CLASS = PLUME_ELEM_SELECTORS.tracklistItem.split(".")[1];
const ITEM_ACTIVE_CLASS = `${ITEM_CLASS}--active`;
const ITEM_UNPLAYABLE_CLASS = `${ITEM_CLASS}--unplayable`;

export const createTracklistToggle = (): {
  toggleBtn: HTMLButtonElement;
  dropdownEl: HTMLDivElement;
  cleanup: () => void;
} => {
  const toggleBtn = document.createElement("button");
  toggleBtn.id = TOGGLE_BTN_ID;
  toggleBtn.type = "button";
  setSvgContent(toggleBtn, PLUME_SVG.chevronDown);
  toggleBtn.ariaExpanded = "false";
  toggleBtn.setAttribute("aria-controls", DROPDOWN_ID);
  toggleBtn.ariaLabel = getString("ARIA__TRACKLIST__TOGGLE_OPEN");
  toggleBtn.title = getString("ARIA__TRACKLIST__TOGGLE_OPEN");

  const dropdownEl = document.createElement("div");
  dropdownEl.id = DROPDOWN_ID;
  dropdownEl.role = "listbox";
  dropdownEl.ariaLabel = getString("ARIA__TRACKLIST__PANEL");
  dropdownEl.ariaHidden = "true";

  let isOpen = false;

  const close = (refocus = true): void => {
    dropdownEl.classList.remove("is-open");
    dropdownEl.ariaHidden = "true";
    toggleBtn.ariaExpanded = "false";
    toggleBtn.ariaLabel = getString("ARIA__TRACKLIST__TOGGLE_OPEN");
    toggleBtn.title = getString("ARIA__TRACKLIST__TOGGLE_OPEN");
    isOpen = false;
    if (refocus) toggleBtn.focus();
  };

  const getPlayableItems = (): HTMLDivElement[] =>
    Array.from(dropdownEl.querySelectorAll<HTMLDivElement>(`.${ITEM_CLASS}:not(.${ITEM_UNPLAYABLE_CLASS})`));

  const updateActiveItem = (): void => {
    const currentTitle = getAppCoreInstance().getState().trackTitle;
    Array.from(dropdownEl.querySelectorAll<HTMLDivElement>(`.${ITEM_CLASS}`)).forEach((item) => {
      const idx = Number(item.dataset["index"]);
      const title = item.dataset["title"] ?? "";
      const isActive = currentTitle !== null && title === currentTitle;
      const wasActive = item.classList.contains(ITEM_ACTIVE_CLASS);
      if (isActive === wasActive) return;

      item.classList.toggle(ITEM_ACTIVE_CLASS, isActive);
      item.ariaSelected = String(isActive);

      if (!item.classList.contains(ITEM_UNPLAYABLE_CLASS)) {
        item.ariaLabel = isActive
          ? getString("ARIA__TRACKLIST__ITEM_CURRENT", [String(idx + 1), title])
          : getString("ARIA__TRACKLIST__ITEM", [String(idx + 1), title]);
      }
    });
  };

  const renderItems = (): void => {
    const bcPlayer = getBcPlayerInstance();
    const rows = bcPlayer.getTrackRows();
    const titles = bcPlayer.getTrackRowTitles();
    const durations = bcPlayer.getTrackRowDurations();
    const playabilityMap = bcPlayer.getTrackPlayabilityMap();
    const currentTitle = getAppCoreInstance().getState().trackTitle;

    dropdownEl.innerHTML = "";

    rows.forEach((_row, idx) => {
      const isPlayable = playabilityMap[idx];
      const title = titles[idx] ?? "";
      const duration = durations[idx] ?? "----";
      const isActive = currentTitle !== null && title === currentTitle;

      const item = document.createElement("div");
      item.className = ITEM_CLASS;
      if (isActive) item.classList.add(ITEM_ACTIVE_CLASS);
      if (!isPlayable) item.classList.add(ITEM_UNPLAYABLE_CLASS);
      item.role = "option";
      item.ariaSelected = String(isActive);
      item.dataset["index"] = String(idx);
      item.dataset["title"] = title;

      if (!isPlayable) {
        item.ariaDisabled = "true";
        item.ariaLabel = getString("ARIA__TRACKLIST__ITEM_UNPLAYABLE", [String(idx + 1), title]);
      } else {
        item.tabIndex = -1;
        item.ariaLabel = isActive
          ? getString("ARIA__TRACKLIST__ITEM_CURRENT", [String(idx + 1), title])
          : getString("ARIA__TRACKLIST__ITEM", [String(idx + 1), title]);
        item.addEventListener("click", () => {
          navigateToTrack(idx, bcPlayer);
        });
      }

      const numSpan = document.createElement("span");
      numSpan.className = `${ITEM_CLASS}__number`;
      numSpan.textContent = `${idx + 1}.`;
      numSpan.ariaHidden = "true";

      const titleSpan = document.createElement("span");
      titleSpan.className = `${ITEM_CLASS}__title`;
      titleSpan.textContent = title;
      titleSpan.ariaHidden = "true";

      const durationSpan = document.createElement("span");
      durationSpan.className = `${ITEM_CLASS}__duration`;
      durationSpan.textContent = duration;
      durationSpan.ariaHidden = "true";

      item.appendChild(numSpan);
      item.appendChild(titleSpan);
      item.appendChild(durationSpan);
      dropdownEl.appendChild(item);
    });
  };

  const open = (): void => {
    renderItems();
    dropdownEl.classList.add("is-open");
    dropdownEl.ariaHidden = "false";
    toggleBtn.ariaExpanded = "true";
    toggleBtn.ariaLabel = getString("ARIA__TRACKLIST__TOGGLE_CLOSE");
    toggleBtn.title = getString("ARIA__TRACKLIST__TOGGLE_CLOSE");
    isOpen = true;

    const activePlayableItem = dropdownEl.querySelector<HTMLDivElement>(
      `.${ITEM_ACTIVE_CLASS}:not(.${ITEM_UNPLAYABLE_CLASS})`
    );
    const firstPlayable = dropdownEl.querySelector<HTMLDivElement>(`.${ITEM_CLASS}:not(.${ITEM_UNPLAYABLE_CLASS})`);
    const focusTarget = activePlayableItem ?? firstPlayable;
    focusTarget?.scrollIntoView({ block: "nearest" });
    focusTarget?.focus();
  };

  toggleBtn.addEventListener("click", () => {
    if (isOpen) close();
    else open();
  });

  dropdownEl.addEventListener("keydown", (e: KeyboardEvent) => {
    const playableItems = getPlayableItems();
    const focused = document.activeElement as HTMLDivElement | null;
    const currentIdx = focused ? playableItems.indexOf(focused) : -1;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        playableItems[currentIdx + 1]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        playableItems[currentIdx - 1]?.focus();
        break;
      case "Home":
        e.preventDefault();
        playableItems[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        playableItems.at(-1)?.focus();
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focused && playableItems.includes(focused)) focused.click();
        break;
    }
  });

  const unsubscribeTrackTitle = getAppCoreInstance().subscribe("trackTitle", () => {
    if (isOpen) updateActiveItem();
  });

  const cleanup = (): void => {
    unsubscribeTrackTitle();
  };

  return { toggleBtn, dropdownEl, cleanup };
};
