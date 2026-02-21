import { BC_ELEM_IDENTIFIERS } from "../../domain/bandcamp";
import { APP_VERSION, PLUME_KO_FI_URL } from "../../domain/meta";
import { PLUME_ELEM_IDENTIFIERS } from "../../domain/plume";
import { CPL, logger } from "../../shared/logger";
import { PLUME_SVG } from "../../svg/icons";
import { getPlumeUiInstance, plumeActions } from "../stores/AppInstanceImpl";
import { getStoreInstance, storeActions } from "../stores/AppStoreImpl";
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

const addRuntime = () => {
  const trackView = document.querySelector(BC_ELEM_IDENTIFIERS.trackView) as HTMLDivElement;
  trackView.insertBefore(getInfoSectionWithRuntime(), trackView.firstChild);
};

export const injectEnhancements = async (): Promise<void> => {
  const store = getStoreInstance();
  const plumeUi = getPlumeUiInstance();

  const bcPlayerContainer = findOriginalPlayerContainer();
  if (!bcPlayerContainer) {
    logger(CPL.ERROR, getString("ERROR__UNABLE_TO_FIND_CONTAINER"));
    return;
  }

  const isAlbumPage = store.getState().pageType === "album";

  hideOriginalPlayerElements();

  const plumeContainer = document.createElement("div");
  plumeContainer.id = PLUME_ELEM_IDENTIFIERS.plumeContainer.split("#")[1];

  const headerContainer = document.createElement("div");
  headerContainer.id = PLUME_ELEM_IDENTIFIERS.headerContainer.split("#")[1];

  const headerLogo = document.createElement("a");
  headerLogo.id = PLUME_ELEM_IDENTIFIERS.headerLogo.split("#")[1];
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
  currentTitleSection.id = PLUME_ELEM_IDENTIFIERS.headerCurrent.split("#")[1];
  currentTitleSection.tabIndex = 0; // make it focusable for screen readers
  currentTitleSection.ariaLabel = isAlbumPage
    ? getString("ARIA__TRACK_CURRENT", [initialTq.current, initialTq.total, initialTrackTitle])
    : getString("ARIA__TRACK", [initialTrackTitle]);
  const currentTitlePretext = document.createElement("span");
  currentTitlePretext.id = PLUME_ELEM_IDENTIFIERS.headerTitlePretext.split("#")[1];
  const initialTrackNumberText = isAlbumPage
    ? getString("LABEL__TRACK_CURRENT", [`${initialTq.current}/${initialTq.total}`])
    : getString("LABEL__TRACK");
  currentTitlePretext.textContent = initialTrackNumberText;
  currentTitlePretext.style.color = getAppropriatePretextColor();
  currentTitlePretext.ariaHidden = "true"; // hide from screen readers to avoid redundancy
  currentTitleSection.appendChild(currentTitlePretext);
  const currentTitleText = document.createElement("span");
  currentTitleText.id = PLUME_ELEM_IDENTIFIERS.headerTitle.split("#")[1];
  currentTitleText.textContent = initialTrackTitle;
  currentTitleText.title = initialTrackTitle; // see full title on hover in case title is truncated
  currentTitleText.ariaHidden = "true"; // hide from screen readers to avoid redundancy
  currentTitleSection.appendChild(currentTitleText);
  headerContainer.appendChild(currentTitleSection);

  // Initialize store with current track title and track number
  store.dispatch(storeActions.setTrackTitle(initialTrackTitle));
  store.dispatch(storeActions.setTrackNumber(initialTrackNumberText));

  plumeUi.dispatch(plumeActions.setTitleDisplay(headerContainer));
  plumeContainer.appendChild(headerContainer);

  const playbackManager = document.createElement("div");
  playbackManager.id = PLUME_ELEM_IDENTIFIERS.playbackManager.split("#")[1];

  const progressContainer = createProgressBar();
  playbackManager.appendChild(progressContainer);
  const playbackControls = createPlaybackControlPanel();
  if (playbackControls) playbackManager.appendChild(playbackControls);
  plumeContainer.appendChild(playbackManager);

  const volumeContainer = await createVolumeControlSection();
  if (volumeContainer) plumeContainer.appendChild(volumeContainer);

  const fullscreenBtnSection = createFullscreenButtonSection(toggleFullscreenMode);
  plumeContainer.appendChild(fullscreenBtnSection);

  bcPlayerContainer.appendChild(plumeContainer);

  logger(CPL.LOG, getString("LOG__MOUNT__COMPLETE"));

  if (isAlbumPage) addRuntime();
};
