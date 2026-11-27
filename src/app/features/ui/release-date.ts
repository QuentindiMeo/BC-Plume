import { PLUME_ELEM_SELECTORS } from "@/infra/elements/plume";
import { getActiveLocale, getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";
import { presentReleaseDate } from "@/shared/presenters";

export const appendReleaseDate = (titlingContainer: HTMLElement, rawDate: string | null): HTMLElement | null => {
  const formattedDate = rawDate ? presentReleaseDate(rawDate, getActiveLocale()) : null;
  if (!formattedDate) {
    logger(CPL.WARN, getString("WARN__RELEASE_DATE__NOT_FOUND"));
    return null;
  }

  const releaseDateEl = document.createElement("p");
  releaseDateEl.id = PLUME_ELEM_SELECTORS.fullscreenTitlingReleaseDate.split("#")[1];
  releaseDateEl.setAttribute("role", "note");
  releaseDateEl.textContent = getString("LABEL__RELEASE_DATE", [formattedDate]);
  releaseDateEl.ariaLabel = getString("ARIA__RELEASE_DATE__LABEL", [formattedDate]);

  const artistHeading = titlingContainer.querySelector("h3");
  if (artistHeading) artistHeading.insertAdjacentElement("afterend", releaseDateEl);
  else titlingContainer.appendChild(releaseDateEl);

  return releaseDateEl;
};
