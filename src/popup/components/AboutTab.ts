import {
  APP_VERSION,
  PLUME_AUTHOR,
  PLUME_BROWSERS,
  PLUME_CHANGELOG_URL,
  PLUME_DONATION_URL,
  PLUME_GITHUB_URL,
  PLUME_ISSUES_URL,
  PLUME_LICENSE,
} from "@/domain/meta";
import type { TabDefinition } from "@/popup/components/TabBar";
import { getString } from "@/shared/i18n";
import { createSafeSvgElement } from "@/shared/svg";
import { PLUME_SVG } from "@/svg/icons";

interface AboutLinkConfig {
  labelKey: string;
  ariaKey: string;
  href: string;
}

const ABOUT_LINKS: AboutLinkConfig[] = [
  { labelKey: "LABEL__ABOUT__LINK__GITHUB", ariaKey: "ARIA__ABOUT__LINK__GITHUB", href: PLUME_GITHUB_URL },
  { labelKey: "LABEL__ABOUT__LINK__CHANGELOG", ariaKey: "ARIA__ABOUT__LINK__CHANGELOG", href: PLUME_CHANGELOG_URL },
  { labelKey: "LABEL__ABOUT__LINK__REPORT", ariaKey: "ARIA__ABOUT__LINK__REPORT", href: PLUME_ISSUES_URL },
  { labelKey: "LABEL__ABOUT__LINK__DONATION", ariaKey: "ARIA__ABOUT__LINK__DONATION", href: PLUME_DONATION_URL },
];

const buildIdentityBlock = (): HTMLElement => {
  const identity = document.createElement("div");
  identity.className = "about__identity";

  const logoWrap = document.createElement("span");
  logoWrap.className = "about__logo";
  logoWrap.role = "img";
  logoWrap.ariaLabel = getString("ARIA__ABOUT__LOGO");
  const logoSvg = createSafeSvgElement(PLUME_SVG.logo);
  if (logoSvg) logoWrap.appendChild(logoSvg);
  identity.appendChild(logoWrap);

  const name = document.createElement("p");
  name.className = "about__name";
  name.textContent = getString("APP_NAME");
  identity.appendChild(name);

  const version = document.createElement("p");
  version.className = "about__version";
  version.textContent = APP_VERSION;
  identity.appendChild(version);

  const tagline = document.createElement("p");
  tagline.className = "about__tagline";
  tagline.textContent = getString("APP_DESCRIPTION");
  identity.appendChild(tagline);

  return identity;
};

const buildInfoRow = (labelKey: string, value: string, useBadge: boolean): HTMLElement => {
  const row = document.createElement("div");
  row.className = "setting-row";

  const label = document.createElement("span");
  label.className = "setting-row__label";
  label.textContent = getString(labelKey);
  row.appendChild(label);

  const valueEl = document.createElement("span");
  valueEl.className = useBadge ? "setting-row__badge" : "about__info-value";
  valueEl.textContent = value;
  row.appendChild(valueEl);

  return row;
};

const buildInfoSection = (): HTMLElement => {
  const section = document.createElement("section");
  section.className = "settings__section";
  section.ariaLabel = getString("LABEL__ABOUT__SECTION__INFO");

  const title = document.createElement("p");
  title.className = "settings__section-title";
  title.textContent = getString("LABEL__ABOUT__SECTION__INFO");
  section.appendChild(title);

  section.appendChild(buildInfoRow("LABEL__ABOUT__AUTHOR", PLUME_AUTHOR, false));
  section.appendChild(buildInfoRow("LABEL__ABOUT__LICENSE", PLUME_LICENSE, false));
  section.appendChild(buildInfoRow("LABEL__ABOUT__BROWSERS", PLUME_BROWSERS, false));

  return section;
};

const buildLinkRow = (config: AboutLinkConfig): HTMLAnchorElement => {
  const { labelKey, ariaKey, href } = config;

  const link = document.createElement("a");
  link.className = "about__link-btn";
  link.href = href;
  link.target = "_blank";
  link.rel = "noreferrer noopener";
  link.textContent = getString(labelKey);
  link.ariaLabel = getString(ariaKey);
  return link;
};

const buildLinksSection = (): HTMLElement => {
  const section = document.createElement("section");
  section.className = "settings__section";
  section.ariaLabel = getString("LABEL__ABOUT__SECTION__LINKS");

  const title = document.createElement("p");
  title.className = "settings__section-title";
  title.textContent = getString("LABEL__ABOUT__SECTION__LINKS");
  section.appendChild(title);

  const linksList = document.createElement("div");
  linksList.className = "about__links-list";
  for (const linkConfig of ABOUT_LINKS) {
    linksList.appendChild(buildLinkRow(linkConfig));
  }
  section.appendChild(linksList);

  return section;
};

/**
 * Returns a buildPanel factory for the About tab.
 * Call the returned function once to produce the tab panel element.
 */
export const createAboutTab = (): TabDefinition["buildPanel"] => {
  return (): HTMLDivElement => {
    const wrapper = document.createElement("div");
    wrapper.appendChild(buildIdentityBlock());
    wrapper.appendChild(buildInfoSection());
    wrapper.appendChild(buildLinksSection());
    return wrapper;
  };
};
