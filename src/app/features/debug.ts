import { getString } from "@/shared/i18n";
import { CPL, logger } from "@/shared/logger";

interface DebugControl {
  index: number;
  tagName: string;
  classes: string;
  title: string;
  text: string;
  onclick: string;
}

// Debug function to identify Bandcamp controls
export const debugBandcampControls = (): Array<DebugControl> => {
  logger(CPL.DEBUG, getString("DEBUG__CONTROL_ELEMENTS__DETECTED"));

  // Find all possible buttons and links
  const buttonIdentifiers = 'button, a, div[role="button"], span[onclick]';
  const allButtons = document.querySelectorAll(buttonIdentifiers) as unknown as Array<HTMLButtonElement>;
  const relevantControls: Array<DebugControl> = [];

  allButtons.forEach((element, index) => {
    const classes = element.className || "";
    const title = element.title || "";
    const text = element.textContent || "";
    const onclick = element.onclick || "";

    // Filter elements that could be controls
    if (
      classes.includes("play") ||
      classes.includes("pause") ||
      classes.includes("next") ||
      classes.includes("prev") ||
      classes.includes("skip") ||
      classes.includes("control") ||
      title.toLowerCase().includes("play") ||
      title.toLowerCase().includes("next") ||
      title.toLowerCase().includes("prev") ||
      title.toLowerCase().includes("skip")
    ) {
      relevantControls.push({
        index,
        tagName: element.tagName,
        classes,
        title,
        text: text.trim().substring(0, 20),
        onclick: onclick.toString().substring(0, 50),
      });
    }
  });

  logger(CPL.DEBUG, getString("DEBUG__CONTROL_ELEMENTS__FOUND"), relevantControls);
  logger(CPL.DEBUG, getString("DEBUG__CONTROL_ELEMENTS__END"));

  return relevantControls;
};
