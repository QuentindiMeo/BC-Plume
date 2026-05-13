import {
  APP_RELEASE_DATE,
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
import { getActiveLocale, getString } from "@/shared/i18n";
import { createSafeSvgElement } from "@/shared/svg";
import { PLUME_SVG } from "@/svg/icons";

interface AboutLinkConfig {
  labelKey: string;
  ariaKey: string;
  href: string;
  emoji: string;
}

const ABOUT_LINKS: AboutLinkConfig[] = [
  { labelKey: "LABEL__ABOUT__LINK__GITHUB", ariaKey: "ARIA__ABOUT__LINK__GITHUB", href: PLUME_GITHUB_URL, emoji: "🐙" },
  {
    labelKey: "LABEL__ABOUT__LINK__CHANGELOG",
    ariaKey: "ARIA__ABOUT__LINK__CHANGELOG",
    href: PLUME_CHANGELOG_URL,
    emoji: "📝",
  },
  { labelKey: "LABEL__ABOUT__LINK__REPORT", ariaKey: "ARIA__ABOUT__LINK__REPORT", href: PLUME_ISSUES_URL, emoji: "🐛" },
  {
    labelKey: "LABEL__ABOUT__LINK__DONATION",
    ariaKey: "ARIA__ABOUT__LINK__DONATION",
    href: PLUME_DONATION_URL,
    emoji: "💸",
  },
];

const buildIdentityBlock = (): HTMLElement => {
  const identity = document.createElement("div");
  identity.id = "identity";

  const logoWrap = document.createElement("span");
  logoWrap.id = "identity__logo";
  logoWrap.role = "img";
  logoWrap.ariaLabel = getString("ARIA__ABOUT__LOGO");
  const logoSvg = createSafeSvgElement(PLUME_SVG.logo);
  if (logoSvg) logoWrap.appendChild(logoSvg);
  identity.appendChild(logoWrap);

  const name = document.createElement("p");
  name.id = "identity__name";
  name.textContent = getString("APP_NAME");
  identity.appendChild(name);

  const version = document.createElement("p");
  version.id = "identity__version";
  const shortVersion = APP_VERSION.substring(0, APP_VERSION.lastIndexOf("."));
  const locale = getActiveLocale().replaceAll("_", "-");
  const fullReleaseDate = new Date(`${APP_RELEASE_DATE}T12:00:00`);
  const localizedReleaseDate = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(fullReleaseDate);
  version.textContent = `${shortVersion} — ${localizedReleaseDate}`;
  identity.appendChild(version);

  const tagline = document.createElement("p");
  tagline.id = "identity__tagline";
  tagline.textContent = getString("APP_DESCRIPTION");
  identity.appendChild(tagline);

  return identity;
};

const buildInfoRow = (labelKey: string, value: string): HTMLElement => {
  const row = document.createElement("div");
  row.className = "setting-row";

  const label = document.createElement("span");
  label.className = "setting-row__label";
  label.textContent = getString(labelKey);
  row.appendChild(label);

  const valueEl = document.createElement("span");
  valueEl.className = "about__info-value";
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

  section.appendChild(buildInfoRow("LABEL__ABOUT__AUTHOR", PLUME_AUTHOR));
  section.appendChild(buildInfoRow("LABEL__ABOUT__LICENSE", PLUME_LICENSE));
  section.appendChild(buildInfoRow("LABEL__ABOUT__BROWSERS", PLUME_BROWSERS));

  return section;
};

const buildLinkRow = (config: AboutLinkConfig): HTMLAnchorElement => {
  const { labelKey, ariaKey, href } = config;

  const link = document.createElement("a");
  link.className = "about__link-btn";
  link.href = href;
  link.target = "_blank";
  link.rel = "noreferrer noopener";
  link.textContent = getString(labelKey) + " " + config.emoji;
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
  linksList.id = "about__links-list";
  for (const linkConfig of ABOUT_LINKS) {
    const linkRow = buildLinkRow(linkConfig);
    linksList.appendChild(linkRow);
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
