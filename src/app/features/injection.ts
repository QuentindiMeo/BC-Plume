import { APP_VERSION, PLUME_KO_FI_URL } from "../../domain/meta";
import { coreActions, IAppCore } from "../../domain/ports/app-core";
import { guiActions, IGui } from "../../domain/ports/plume-ui";
import { BC_ELEM_SELECTORS } from "../../infra/elements/bandcamp";
import { PLUME_ELEM_SELECTORS } from "../../infra/elements/plume";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { PLUME_SVG } from "../../svg/icons";
import { getBcPlayerInstance } from "../stores/adapters";
import { getAppCoreInstance } from "../stores/AppCoreImpl";
import { getGuiInstance } from "../stores/GuiImpl";
import { toggleFullscreenMode } from "./fullscreen";
import { findOriginalPlayerContainer, hideOriginalPlayerElements } from "./original-player";
import { getInfoSectionWithRuntime } from "./runtime";
import { getTrackQuantifiers } from "./track-quantifiers";
import { getAppropriatePretextColor, getCurrentTrackTitle } from "./track-title";
import {
  createFullscreenButtonSection,
  createPlaybackControlPanel,
  createProgressBar,
  createVolumeControlSection,
} from "./ui";
import { createToast } from "./ui/toast";

interface PlumeView {
  plumeContainer: HTMLDivElement;
  headerContainer: HTMLDivElement;
  headerLogo: HTMLAnchorElement;

  // Derived values computed during construction, forwarded to hydration
  initialTrackTitle: string;
  initialTrackNumberText: string;
}

const notifyUnplayableTracks = () => {
  const bcPlayer = getBcPlayerInstance();
  const trackRows = bcPlayer.getTrackRows();
  const unplayableTracks: { nb: number; title: string }[] = [];

  trackRows.forEach((row, idx) => {
    if (row.classList.contains("linked")) return;

    const titleEl = row.querySelector<HTMLDivElement>(BC_ELEM_SELECTORS.unplayableTrackTitle);
    const title = titleEl?.textContent?.trim() ?? `#${idx + 1}`;
    unplayableTracks.push({ nb: idx + 1, title });
  });

  if (unplayableTracks.length === 0) return;
  if (unplayableTracks.length === 1) {
    const { nb, title } = unplayableTracks[0];
    createToast({
      label: getString("META__TOAST__UNPLAYABLE_TRACK"),
      title: getString("LABEL__TOAST__UNPLAYABLE_TRACK__TITLE", [String(nb)]),
      description: getString("LABEL__TOAST__UNPLAYABLE_TRACK__DESCRIPTION", [title]),
      borderType: "warning",
    });
    return;
  }
  const titlesList = unplayableTracks.map((t) => t.nb).join(", ");
  createToast({
    label: getString("META__TOAST__UNPLAYABLE_TRACKS"),
    title: getString("LABEL__TOAST__UNPLAYABLE_TRACKS__TITLE", [String(unplayableTracks.length)]),
    description: getString("LABEL__TOAST__UNPLAYABLE_TRACKS__DESCRIPTION", [titlesList]),
    borderType: "warning",
  });
};

const addRuntime = () => {
  const bcPlayer = getBcPlayerInstance();
  const trackView = bcPlayer.getTrackView();
  if (!trackView) return;

  trackView.insertBefore(getInfoSectionWithRuntime(), trackView.firstChild);
};

const buildPlumeView = async (isAlbumPage: boolean): Promise<PlumeView> => {
  const plumeContainer = document.createElement("div");
  plumeContainer.id = PLUME_ELEM_SELECTORS.plumeContainer.split("#")[1];

  const headerContainer = document.createElement("div");
  headerContainer.id = PLUME_ELEM_SELECTORS.headerContainer.split("#")[1];

  const headerLogo = document.createElement("a");
  headerLogo.id = PLUME_ELEM_SELECTORS.headerLogo.split("#")[1];
  headerLogo.innerHTML = PLUME_SVG.logo + `<p id="${headerLogo.id}__version">${APP_VERSION}</p>`;
  headerLogo.href = PLUME_KO_FI_URL;
  headerLogo.target = "_blank";
  headerLogo.rel = "noopener noreferrer";
  headerLogo.ariaLabel = getString("ARIA__APP_NAME");
  headerLogo.title = getString("ARIA__LOGO_LINK");
  headerContainer.appendChild(headerLogo);

  const bcPlayer = getBcPlayerInstance();
  const initialTrackTitle = getCurrentTrackTitle(isAlbumPage);
  const initialTq = getTrackQuantifiers(initialTrackTitle, bcPlayer);
  const currentTitleSection = document.createElement("div");
  currentTitleSection.id = PLUME_ELEM_SELECTORS.headerCurrent.split("#")[1];
  currentTitleSection.tabIndex = 0; // make it focusable for screen readers
  currentTitleSection.ariaLabel = isAlbumPage
    ? getString("ARIA__TRACK_CURRENT", [String(initialTq.current), String(initialTq.total), initialTrackTitle])
    : getString("ARIA__TRACK", [initialTrackTitle]);
  const currentTitlePretext = document.createElement("span");
  currentTitlePretext.id = PLUME_ELEM_SELECTORS.headerTitlePretext.split("#")[1];
  const initialTrackNumberText = isAlbumPage
    ? getString("LABEL__TRACK_CURRENT", [`${initialTq.current}/${initialTq.total}`])
    : getString("LABEL__TRACK");
  currentTitlePretext.textContent = initialTrackNumberText;
  currentTitlePretext.style.color = getAppropriatePretextColor();
  currentTitlePretext.ariaHidden = "true"; // hide from screen readers to avoid redundancy
  currentTitleSection.appendChild(currentTitlePretext);
  const currentTitleText = document.createElement("span");
  currentTitleText.id = PLUME_ELEM_SELECTORS.headerTitle.split("#")[1];
  currentTitleText.textContent = initialTrackTitle;
  currentTitleText.title = initialTrackTitle; // see full title on hover in case title is truncated
  currentTitleText.ariaHidden = "true"; // hide from screen readers to avoid redundancy
  currentTitleSection.appendChild(currentTitleText);
  headerContainer.appendChild(currentTitleSection);

  plumeContainer.appendChild(headerContainer);

  const playbackManager = document.createElement("div");
  playbackManager.id = PLUME_ELEM_SELECTORS.playbackManager.split("#")[1];

  const progressContainer = createProgressBar();
  playbackManager.appendChild(progressContainer);
  const playbackControls = createPlaybackControlPanel();
  if (playbackControls) playbackManager.appendChild(playbackControls);
  plumeContainer.appendChild(playbackManager);

  const volumeContainer = await createVolumeControlSection();
  if (volumeContainer) plumeContainer.appendChild(volumeContainer);

  const fullscreenBtnSection = createFullscreenButtonSection(toggleFullscreenMode);
  plumeContainer.appendChild(fullscreenBtnSection);

  return { plumeContainer, headerContainer, headerLogo, initialTrackTitle, initialTrackNumberText };
};

const hydratePlumeView = (view: PlumeView, appCore: IAppCore, plumeUi: IGui): void => {
  appCore.dispatch(coreActions.setTrackTitle(view.initialTrackTitle));
  appCore.dispatch(coreActions.setTrackNumber(view.initialTrackNumberText));

  plumeUi.dispatch(guiActions.setTitleDisplay(view.headerContainer));
  plumeUi.dispatch(guiActions.setPlumeContainer(view.plumeContainer));
  plumeUi.dispatch(guiActions.setHeaderLogo(view.headerLogo));
};

// Appends the Plume root element to the Bandcamp player container.
const mountPlumeView = (view: PlumeView, container: Element): void => {
  container.appendChild(view.plumeContainer);
};

export const injectEnhancements = async (): Promise<boolean> => {
  const appCore = getAppCoreInstance();
  const plumeUi = getGuiInstance();

  const bcPlayerContainer = findOriginalPlayerContainer();
  if (!bcPlayerContainer) {
    logger(CPL.ERROR, getString("ERROR__UNABLE_TO_FIND_CONTAINER"));
    return false;
  }

  const isAlbumPage = appCore.getState().pageType === "album";

  hideOriginalPlayerElements();

  const view = await buildPlumeView(isAlbumPage);
  hydratePlumeView(view, appCore, plumeUi);
  mountPlumeView(view, bcPlayerContainer);

  logger(CPL.LOG, getString("LOG__MOUNT__COMPLETE"));

  if (isAlbumPage) {
    addRuntime();
    notifyUnplayableTracks();
  }
  return true;
};
