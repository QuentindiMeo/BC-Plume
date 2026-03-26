import { getString } from "../../shared/i18n";

export interface TabDefinition {
  id: string;
  label: string;
  buildPanel: () => HTMLDivElement;
}

interface TabBarInstance {
  el: HTMLDivElement;
  activate: (id: string) => void;
}

export const createTabBar = (tabs: TabDefinition[]): TabBarInstance => {
  const wrapper = document.createElement("div");

  const tablist = document.createElement("div");
  tablist.role = "tablist";
  tablist.className = "popup__tablist";
  tablist.ariaLabel = getString("ARIA__POPUP__TABLIST");
  wrapper.appendChild(tablist);

  const tabBtns = new Map<string, HTMLButtonElement>();
  const tabPanels = new Map<string, HTMLDivElement>();

  const toggleTab = (id: string): void => {
    for (const [tabId, btn] of tabBtns) {
      const isActive = tabId === id;
      btn.ariaSelected = isActive.toString();
      btn.tabIndex = isActive ? 0 : -1;
      btn.classList.toggle("active", isActive);
    }
    for (const [tabId, panel] of tabPanels) {
      panel.hidden = tabId !== id;
    }
  };

  for (const tab of tabs) {
    const btn = document.createElement("button");
    btn.role = "tab";
    btn.className = "popup__tab";
    btn.id = `tab-${tab.id}`;
    btn.setAttribute("aria-controls", `tabpanel-${tab.id}`);
    btn.ariaSelected = "false";
    btn.tabIndex = -1;
    btn.textContent = tab.label;
    btn.addEventListener("click", () => toggleTab(tab.id));
    tablist.appendChild(btn);
    tabBtns.set(tab.id, btn);

    const panel = document.createElement("div");
    panel.role = "tabpanel";
    panel.className = "popup__tab-panel";
    panel.id = `tabpanel-${tab.id}`;
    panel.setAttribute("aria-labelledby", `tab-${tab.id}`);
    panel.hidden = true;
    panel.appendChild(tab.buildPanel());
    wrapper.appendChild(panel);
    tabPanels.set(tab.id, panel);
  }

  const addKeyboardNavigation = (e: KeyboardEvent): void => {
    const ids = tabs.map((t) => t.id);
    const activeId = [...tabBtns.entries()].find(([, btn]) => btn.ariaSelected === "true")?.[0];
    if (!activeId) return;

    const currentIndex = ids.indexOf(activeId);
    let nextIndex = -1;

    if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % ids.length;
    else if (e.key === "ArrowLeft") nextIndex = (currentIndex - 1 + ids.length) % ids.length;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = ids.length - 1;
    else return;

    e.preventDefault();
    const nextId = ids[nextIndex];
    toggleTab(nextId);
    tabBtns.get(nextId)?.focus();
  };

  tablist.addEventListener("keydown", (e: KeyboardEvent) => addKeyboardNavigation(e));

  // Activate the first tab by default
  if (tabs.length > 0) toggleTab(tabs[0].id);

  return { el: wrapper, activate: toggleTab };
};
