import { PLUME_ELEM_IDENTIFIERS } from "../../domain/plume";
import { AnyFunction } from "../../shared/types";
import { PLUME_SVG } from "../../svg/icons";
import { getString } from "../i18n";

const createFullscreenButton = (onToggle: AnyFunction): HTMLButtonElement => {
  const fullscreenBtnId = PLUME_ELEM_IDENTIFIERS.fullscreenBtnLabel.split("#")[1];
  const fullscreenBtnLabel = getString("LABEL__FULLSCREEN_TOGGLE");

  const fullscreenBtn: HTMLButtonElement = document.createElement("button");
  fullscreenBtn.id = PLUME_ELEM_IDENTIFIERS.fullscreenBtn.split("#")[1];
  fullscreenBtn.type = "button";
  fullscreenBtn.innerHTML = `<span id="${fullscreenBtnId}">${fullscreenBtnLabel}</span>${PLUME_SVG.fullscreen}`;
  fullscreenBtn.ariaLabel = fullscreenBtnLabel;
  fullscreenBtn.addEventListener("click", onToggle);

  return fullscreenBtn;
};

export const createFullscreenButtonSection = (onToggle: AnyFunction): HTMLDivElement => {
  const container: HTMLDivElement = document.createElement("div");
  container.id = PLUME_ELEM_IDENTIFIERS.fullscreenBtnContainer.split("#")[1];

  const fullscreenBtn = createFullscreenButton(onToggle);
  container.appendChild(fullscreenBtn);

  return container;
};
