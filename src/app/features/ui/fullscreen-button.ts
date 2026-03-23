import { PLUME_ELEM_SELECTORS } from "../../../infra/elements/plume";
import { getString } from "../../../shared/i18n";
import { createSafeSvgElement } from "../../../shared/svg";
import { NoArgFunction } from "../../../shared/types";
import { PLUME_SVG } from "../../../svg/icons";

const createFullscreenButton = (onToggle: NoArgFunction): HTMLButtonElement => {
  const fullscreenBtnId = PLUME_ELEM_SELECTORS.fullscreenBtnLabel.split("#")[1];
  const fullscreenBtnLabel = getString("LABEL__FULLSCREEN_TOGGLE");

  const fullscreenBtn: HTMLButtonElement = document.createElement("button");
  fullscreenBtn.id = PLUME_ELEM_SELECTORS.fullscreenBtn.split("#")[1];
  fullscreenBtn.type = "button";
  const labelSpan = document.createElement("span");
  labelSpan.id = fullscreenBtnId;
  labelSpan.textContent = fullscreenBtnLabel;
  fullscreenBtn.appendChild(labelSpan);
  const svgEl = createSafeSvgElement(PLUME_SVG.fullscreen);
  if (svgEl) fullscreenBtn.appendChild(svgEl);
  fullscreenBtn.ariaLabel = fullscreenBtnLabel;
  fullscreenBtn.addEventListener("click", onToggle);

  return fullscreenBtn;
};

export const createFullscreenButtonSection = (onToggle: NoArgFunction): HTMLDivElement => {
  const container: HTMLDivElement = document.createElement("div");
  container.id = PLUME_ELEM_SELECTORS.fullscreenBtnContainer.split("#")[1];

  const fullscreenBtn = createFullscreenButton(onToggle);
  container.appendChild(fullscreenBtn);

  return container;
};
