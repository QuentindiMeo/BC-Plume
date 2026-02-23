import { measureContrastRatioWCAG } from "../../shared/colors";
import { getString } from "../../shared/i18n";
import { CPL, logger } from "../../shared/logger";
import { getBcPlayerInstance } from "../stores/adapters";

interface RuntimeInfo {
  totalRuntime: number;
  formattedTotalRuntime: string;
  ariaString: string;
  calculated: boolean;
}

const runtimeInfo: RuntimeInfo = {
  totalRuntime: 0,
  formattedTotalRuntime: "",
  ariaString: "",
  calculated: false,
};

export const getInfoSectionWithRuntime = (): HTMLDivElement => {
  const bcPlayer = getBcPlayerInstance();
  if (!runtimeInfo.calculated) {
    const trackRowDurations = bcPlayer.getTrackRowDurations();
    if (trackRowDurations.length === 0) {
      logger(CPL.WARN, getString("WARN__TRACK_LIST__NOT_FOUND"));
      const errorDiv = document.createElement("div");
      errorDiv.textContent = getString("WARN__RUNTIME__NOT_CALCULATED");
      return errorDiv;
    }

    trackRowDurations.forEach((durationText, idx) => {
      if (durationText === null) {
        logger(CPL.WARN, getString("WARN__DURATION_CELL__NOT_FOUND"), [idx]);
        return;
      }
      const parts = durationText.split(":").map((part) => Number.parseInt(part, 10));
      let seconds = 0;
      if (parts.length === 2) {
        // MM:SS
        seconds = parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        // HH:MM:SS
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      runtimeInfo.totalRuntime += seconds;
    });
    const minutes = Math.floor(runtimeInfo.totalRuntime / 60);
    const seconds = runtimeInfo.totalRuntime % 60;
    runtimeInfo.formattedTotalRuntime = getString("LABEL__RUNTIME", [
      minutes,
      seconds < 10 ? "0" + seconds : seconds.toString(),
    ]);
    runtimeInfo.ariaString = getString("ARIA__RUNTIME__LABEL", [
      Math.floor(runtimeInfo.totalRuntime / 60),
      runtimeInfo.totalRuntime % 60,
    ]);
    logger(CPL.INFO, getString("INFO__RUNTIME__CALCULATED"), runtimeInfo.formattedTotalRuntime);

    runtimeInfo.calculated = true;
  }

  const infoSectionId = "name-section";
  const infoSection = bcPlayer.getInfoSection();
  if (!infoSection) {
    logger(CPL.WARN, getString("WARN__INFO_SECTION__NOT_FOUND"));
    return document.createElement("div");
  }
  const titleHeadingClone = infoSection.querySelector("h2")!.cloneNode(true);
  const artistHeadingClone = infoSection.querySelector("h3")!.cloneNode(true);

  const newNameSection = document.createElement("div");
  newNameSection.id = infoSectionId;

  const newTitleHeading = document.createElement("div");
  newTitleHeading.className = infoSectionId + "__titling";
  newTitleHeading.appendChild(titleHeadingClone);

  const mainSectionBackground = bcPlayer.getPageBackground()!;
  const bgColor = globalThis.getComputedStyle(mainSectionBackground).getPropertyValue("background");
  const bgColorAsRGB = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(bgColor);
  const r = Number.parseInt(bgColorAsRGB![1], 10);
  const g = Number.parseInt(bgColorAsRGB![2], 10);
  const b = Number.parseInt(bgColorAsRGB![3], 10);
  const runtimeTextColor = measureContrastRatioWCAG([r, g, b]) >= 3 ? "#0000007f" : "#ffffff7f";

  const runtimeSpan = document.createElement("span");
  runtimeSpan.className = "runtime";
  runtimeSpan.textContent = "(" + runtimeInfo.formattedTotalRuntime + ")";
  runtimeSpan.style.color = runtimeTextColor;
  runtimeSpan.ariaLabel = runtimeInfo.ariaString;
  newTitleHeading.appendChild(runtimeSpan);

  newNameSection.appendChild(newTitleHeading);
  newNameSection.appendChild(artistHeadingClone);
  infoSection.remove();

  return newNameSection;
};
