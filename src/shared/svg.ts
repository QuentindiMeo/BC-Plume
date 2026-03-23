import { getString } from "./i18n";
import { CPL, logger } from "./logger";
import { PLUME_SVG } from "../svg/icons";

/**
 * Parses SVG markup and returns a sanitized SVGElement, stripping dangerous content.
 * Returns null if parsing fails or the markup is not a valid SVG root.
 */
export const createSafeSvgElement = (svgMarkup: PLUME_SVG): SVGElement | null => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgMarkup, "image/svg+xml");
    const root = doc.documentElement;
    if (!(root instanceof SVGElement) || root.nodeName.toLowerCase() !== "svg") {
      return null;
    }

    // Remove potentially dangerous elements:
    // - script/foreignObject: obvious injection vectors
    // - a: makes content clickable with arbitrary href
    // - animate/set/animateMotion/animateTransform: can dynamically rewrite href attributes
    // - style: can contain @import or url(...) pointing to external resources
    root
      .querySelectorAll("script,foreignObject,a,animate,set,animateMotion,animateTransform,style")
      .forEach((el) => el.remove());

    // Strip inline event handlers (on*) and restrict hrefs to safe fragment refs.
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

    let current = walker.currentNode as Element | null;
    while (current) {
      Array.from(current.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on")) {
          current!.removeAttribute(attr.name);
        } else if (name === "href" || name === "xlink:href") {
          const attrValue = attr.value.trim();
          // Only allow internal fragment references (e.g. "#symbol-id").
          if (!attrValue.startsWith("#")) {
            current!.removeAttribute(attr.name);
          } else if (attrValue !== attr.value) {
            current!.setAttribute(attr.name, attrValue);
          }
        }
      });
      if (!walker.nextNode()) break;
      current = walker.currentNode as Element | null;
    }
    return root;
  } catch (e) {
    logger(CPL.WARN, getString("WARN__TOAST__SVG_PARSE_FAILED"), e);
    return null;
  }
};

/**
 * Replaces an element's children with a sanitized SVG element.
 * Clears existing content and appends the parsed SVG.
 */
export const setSvgContent = (element: Element, svgMarkup: PLUME_SVG): void => {
  element.textContent = "";
  const svg = createSafeSvgElement(svgMarkup);
  if (svg) element.appendChild(svg);
};
