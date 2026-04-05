import { toggleFullscreenMode } from "@/app/features/fullscreen";
import { findOriginalPlayerContainer, hideOriginalPlayerElements } from "@/app/features/original-player";
import { getInfoSectionWithRuntime } from "@/app/features/runtime";
import { getTrackQuantifiers } from "@/app/features/track-quantifiers";
import { getAppropriateAccentColor, getCurrentTrackTitle } from "@/app/features/track-title";
import { CleanupCallback } from "@/app/features/types";
import {
  createFullscreenButtonSection,
  createPlaybackControlPanel,
  createProgressBar,
  createTracklistToggle,
  createVolumeControlSection,
} from "@/app/features/ui";
import { createToast } from "@/app/features/ui/toast";
import { getBcPlayerInstance } from "@/app/stores/adapters";
import { getAppCoreInstance } from "@/app/stores/AppCoreImpl";
import { getGuiInstance } from "@/app/stores/GuiImpl";
import { APP_VERSION, PLUME_KO_FI_URL } from "@/domain/meta";
import { coreActions, IAppCore } from "@/domain/ports/app-core";
import { guiActions, IGui } from "@/domain/ports/plume-ui";
import { PLUME_ELEM_SELECTORS } from "@/infra/elements/plume";
import { getActiveLocale, getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";
import { createSafeSvgElement } from "@/shared/svg";
import { PLUME_SVG } from "@/svg/icons";

interface PlumeView {
  plumeContainer: HTMLDivElement;
  headerContainer: HTMLDivElement;
  headerLogo: HTMLAnchorElement;

  // Derived values computed during construction, forwarded to hydration
  initialTrackTitle: string;
  initialTrackNumberText: string;

  tracklistCleanup: CleanupCallback;
}

const notifyUnplayableTracks = () => {
  const bcPlayer = getBcPlayerInstance();
  const playabilityMap = bcPlayer.getTrackPlayabilityMap();
  const titles = bcPlayer.getTrackRowTitles();
  const unplayableTracks: { nb: number; title: string }[] = [];

  playabilityMap.forEach((isPlayable, idx) => {
    if (isPlayable) return;
    const title = titles[idx] ?? `#${idx + 1}`;
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
  } else {
    const titlesList = unplayableTracks.map((track) => track.nb).join(", ");
    createToast({
      label: getString("META__TOAST__UNPLAYABLE_TRACKS"),
      title: getString("LABEL__TOAST__UNPLAYABLE_TRACKS__TITLE", [String(unplayableTracks.length)]),
      description: getString("LABEL__TOAST__UNPLAYABLE_TRACKS__DESCRIPTION", [titlesList]),
      borderType: "warning",
    });
  }
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
  plumeContainer.lang = getActiveLocale();
  plumeContainer.role = "region";
  plumeContainer.ariaLabel = getString("ARIA__APP_NAME");

  const headerContainer = document.createElement("div");
  headerContainer.id = PLUME_ELEM_SELECTORS.headerContainer.split("#")[1];

  const headerLogo = document.createElement("a");
  headerLogo.id = PLUME_ELEM_SELECTORS.headerLogo.split("#")[1];
  const logoSvg = createSafeSvgElement(PLUME_SVG.logo);
  if (logoSvg) headerLogo.appendChild(logoSvg);
  const versionTag = document.createElement("p");
  versionTag.id = `${headerLogo.id}__version`;
  versionTag.textContent = APP_VERSION;
  headerLogo.appendChild(versionTag);
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
  currentTitleSection.ariaLabel = isAlbumPage
    ? getString("ARIA__TRACK_CURRENT", [String(initialTq.current), String(initialTq.total), initialTrackTitle])
    : getString("ARIA__TRACK", [initialTrackTitle]);
  const currentTitlePretext = document.createElement("span");
  currentTitlePretext.id = PLUME_ELEM_SELECTORS.headerTitlePretext.split("#")[1];
  const initialTrackNumberText = isAlbumPage
    ? getString("LABEL__TRACK_CURRENT", [`${initialTq.current}/${initialTq.total}`])
    : getString("LABEL__TRACK");
  currentTitlePretext.textContent = initialTrackNumberText;
  currentTitlePretext.style.color = getAppropriateAccentColor();
  currentTitlePretext.ariaHidden = "true"; // hide from screen readers to avoid redundancy
  currentTitleSection.appendChild(currentTitlePretext);
  const titleRow = document.createElement("div");
  titleRow.className = "bpe-header-title-row";

  if (isAlbumPage) {
    const trackLink = document.createElement("a");
    trackLink.id = PLUME_ELEM_SELECTORS.headerTrackLink.split("#")[1];
    const trackUrl = bcPlayer.getCurrentTrackUrl();
    if (trackLink) {
      if (trackUrl) {
        trackLink.href = trackUrl;
        trackLink.ariaDisabled = "false";
        trackLink.style.pointerEvents = "";
        trackLink.tabIndex = 0;
      } else {
        trackLink.removeAttribute("href");
        trackLink.ariaDisabled = "true";
        trackLink.style.pointerEvents = "none";
        trackLink.tabIndex = -1;
      }
    } else {
      logger(CPL.WARN, getString("WARN__TRACK_LINK__NOT_FOUND"));
    }
    trackLink.target = "_self";
    trackLink.ariaLabel = getString("ARIA__TRACK_LINK");
    trackLink.title = getString("ARIA__TRACK_LINK");
    const linkSvg = createSafeSvgElement(PLUME_SVG.externalLink);
    if (linkSvg) trackLink.appendChild(linkSvg);
    titleRow.appendChild(trackLink);
  }

  const currentTitleText = document.createElement("span");
  currentTitleText.id = PLUME_ELEM_SELECTORS.headerTitle.split("#")[1];
  currentTitleText.textContent = initialTrackTitle;
  currentTitleText.title = initialTrackTitle; // see full title on hover in case title is truncated
  currentTitleText.ariaHidden = "true"; // hide from screen readers to avoid redundancy
  titleRow.appendChild(currentTitleText);

  let tracklistCleanup: CleanupCallback = () => {}; // not optional because of return type
  let pendingDropdown: HTMLDivElement | undefined;
  if (isAlbumPage) {
    const { toggleBtn, dropdownEl, cleanup } = createTracklistToggle();
    titleRow.appendChild(toggleBtn);
    pendingDropdown = dropdownEl;
    tracklistCleanup = cleanup;
  }
  currentTitleSection.appendChild(titleRow);

  headerContainer.appendChild(currentTitleSection);

  plumeContainer.appendChild(headerContainer);
  if (pendingDropdown) plumeContainer.appendChild(pendingDropdown);

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

  return { plumeContainer, headerContainer, headerLogo, initialTrackTitle, initialTrackNumberText, tracklistCleanup };
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

export const injectEnhancements = async (): Promise<{ ok: boolean; tracklistCleanup: CleanupCallback }> => {
  const appCore = getAppCoreInstance();
  const plumeUi = getGuiInstance();

  const bcPlayerContainer = findOriginalPlayerContainer();
  if (!bcPlayerContainer) {
    logger(CPL.ERROR, getString("ERROR__UNABLE_TO_FIND_CONTAINER"));
    return { ok: false, tracklistCleanup: () => {} };
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
  return { ok: true, tracklistCleanup: view.tracklistCleanup };
};
