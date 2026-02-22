import { APP_VERSION, PLUME_KO_FI_URL } from "../../domain/meta";
import { bandcampPlayer } from "../../infra/adapters";
import { IAppCore } from "../../infra/AppCore";
import { PLUME_ELEM_SELECTORS } from "../../infra/elements/plume";
import { IGui } from "../../infra/Gui";
import { CPL, logger } from "../../shared/logger";
import { PLUME_SVG } from "../../svg/icons";
import { coreActions, getAppCoreInstance } from "../stores/AppCoreImpl";
import { getGuiInstance, guiActions } from "../stores/GuiImpl";
import { toggleFullscreenMode } from "./fullscreen";
import { getString } from "./i18n";
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

interface PlumeView {
  plumeContainer: HTMLDivElement;
  headerContainer: HTMLDivElement;
  headerLogo: HTMLAnchorElement;

  // Derived values computed during construction, forwarded to hydration
  initialTrackTitle: string;
  initialTrackNumberText: string;
}

const addRuntime = () => {
  const trackView = bandcampPlayer.getTrackView();
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

  const initialTrackTitle = getCurrentTrackTitle(isAlbumPage);
  const initialTq = getTrackQuantifiers(initialTrackTitle);
  const currentTitleSection = document.createElement("div");
  currentTitleSection.id = PLUME_ELEM_SELECTORS.headerCurrent.split("#")[1];
  currentTitleSection.tabIndex = 0; // make it focusable for screen readers
  currentTitleSection.ariaLabel = isAlbumPage
    ? getString("ARIA__TRACK_CURRENT", [initialTq.current, initialTq.total, initialTrackTitle])
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

  if (isAlbumPage) addRuntime();
  return true;
};
