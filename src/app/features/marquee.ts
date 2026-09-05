const MARQUEE_TEXT_CLASS = "plume-marquee__text";
const MARQUEE_OVERFLOWING_CLASS = "plume-marquee--overflowing";
const MARQUEE_PIXELS_PER_SECOND = 40;
const MARQUEE_MIN_DURATION_S = 3;
const MARQUEE_MAX_DURATION_S = 12;

// ? Renders `text` inside `container` wrapped in an inner span, then measures overflow once the container has been laid out.
// ? When the text is wider than the container, toggles the `plume-marquee--overflowing` class and sets the CSS custom
// ? properties that drive the hover/focus horizontal auto-scroll (see .plume-marquee__text rules in styles.scss).
export const applyMarqueeText = (container: HTMLElement, text: string): void => {
  container.textContent = "";

  const textSpan = document.createElement("span");
  textSpan.className = MARQUEE_TEXT_CLASS;
  textSpan.textContent = text;
  container.appendChild(textSpan);

  // ? Deferred to the next frame: the container may not be mounted/laid out yet at call time.
  requestAnimationFrame(() => {
    // ! getBoundingClientRect(), not scrollWidth/offsetWidth: textSpan is `display: inline` at rest (required for
    // ! correct ellipsis rendering — see .plume-marquee__text in styles.scss), and non-replaced inline elements
    // ! are specified to report 0 for scrollWidth/offsetWidth/clientWidth regardless of their real content size.
    const overflow = textSpan.getBoundingClientRect().width - container.clientWidth;
    const isOverflowing = overflow > 1; // ? tolerance for subpixel rounding

    container.classList.toggle(MARQUEE_OVERFLOWING_CLASS, isOverflowing);
    if (!isOverflowing) {
      container.style.removeProperty("--plume-marquee-distance");
      container.style.removeProperty("--plume-marquee-duration");
      return;
    }

    const duration = Math.min(
      MARQUEE_MAX_DURATION_S,
      Math.max(MARQUEE_MIN_DURATION_S, overflow / MARQUEE_PIXELS_PER_SECOND)
    );
    container.style.setProperty("--plume-marquee-distance", `-${overflow}px`);
    container.style.setProperty("--plume-marquee-duration", `${duration}s`);
  });
};
