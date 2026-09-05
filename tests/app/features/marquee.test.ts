// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { applyMarqueeText } from "@/app/features/marquee";

const nextFrame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()));

// ! happy-dom does not compute layout, so clientWidth/getBoundingClientRect are stubbed per test scenario.
const withWidths = (container: HTMLElement, textSpan: HTMLElement, containerWidth: number, textWidth: number): void => {
  Object.defineProperty(container, "clientWidth", { value: containerWidth, configurable: true });
  textSpan.getBoundingClientRect = () => ({ width: textWidth }) as DOMRect;
};

describe("applyMarqueeText", () => {
  it("wraps the text in an inner .plume-marquee__text span", () => {
    const container = document.createElement("span");
    applyMarqueeText(container, "Some Track Title");

    const textSpan = container.querySelector(".plume-marquee__text");
    expect(textSpan).not.toBeNull();
    expect(textSpan?.textContent).toBe("Some Track Title");
    expect(container.textContent).toBe("Some Track Title");
  });

  it("replaces any previous content on re-render", () => {
    const container = document.createElement("span");
    applyMarqueeText(container, "First Title");
    applyMarqueeText(container, "Second Title");

    expect(container.children).toHaveLength(1);
    expect(container.textContent).toBe("Second Title");
  });

  it("marks the container as overflowing and sets scroll distance/duration when the text is wider", async () => {
    const container = document.createElement("span");
    applyMarqueeText(container, "A Very Long Track Title That Does Not Fit");
    const textSpan = container.querySelector(".plume-marquee__text") as HTMLElement;

    withWidths(container, textSpan, 100, 180);
    await nextFrame();

    expect(container.classList.contains("plume-marquee--overflowing")).toBe(true);
    expect(container.style.getPropertyValue("--plume-marquee-distance")).toBe("-80px");
    expect(container.style.getPropertyValue("--plume-marquee-duration")).not.toBe("");
  });

  it("does not mark the container as overflowing when the text fits", async () => {
    const container = document.createElement("span");
    applyMarqueeText(container, "Short Title");
    const textSpan = container.querySelector(".plume-marquee__text") as HTMLElement;

    withWidths(container, textSpan, 200, 120);
    await nextFrame();

    expect(container.classList.contains("plume-marquee--overflowing")).toBe(false);
    expect(container.style.getPropertyValue("--plume-marquee-distance")).toBe("");
    expect(container.style.getPropertyValue("--plume-marquee-duration")).toBe("");
  });

  it("clears stale overflow state when re-rendered with a shorter, non-overflowing title", async () => {
    const container = document.createElement("span");
    applyMarqueeText(container, "A Very Long Track Title That Does Not Fit");
    const firstTextSpan = container.querySelector(".plume-marquee__text") as HTMLElement;
    withWidths(container, firstTextSpan, 100, 180);
    await nextFrame();
    expect(container.classList.contains("plume-marquee--overflowing")).toBe(true);

    applyMarqueeText(container, "Short");
    const secondTextSpan = container.querySelector(".plume-marquee__text") as HTMLElement;
    withWidths(container, secondTextSpan, 100, 50);
    await nextFrame();

    expect(container.classList.contains("plume-marquee--overflowing")).toBe(false);
    expect(container.style.getPropertyValue("--plume-marquee-distance")).toBe("");
  });
});
