// @vitest-environment jsdom — happy-dom doesn't reflect the `ariaLive` IDL property to the aria-live attribute
import { beforeEach, describe, expect, it } from "vitest";

import { announce } from "@/shared/announce";

const flushAnnounceFrame = () => new Promise<void>((resolve) => setTimeout(resolve, 50));

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("announce", () => {
  it("creates a role=status, aria-live=polite live region on first use", async () => {
    announce("hello");
    await flushAnnounceFrame();

    const region = document.querySelector(".sr-live");
    expect(region).not.toBeNull();
    expect(region?.getAttribute("role")).toBe("status");
    expect(region?.getAttribute("aria-live")).toBe("polite");
    expect(region?.textContent).toBe("hello");
  });

  it("reuses the same region across calls rather than creating a new one each time", async () => {
    announce("first");
    await flushAnnounceFrame();
    const firstRegion = document.querySelector(".sr-live");

    announce("second");
    await flushAnnounceFrame();
    const secondRegion = document.querySelector(".sr-live");

    expect(document.querySelectorAll(".sr-live")).toHaveLength(1);
    expect(secondRegion).toBe(firstRegion);
    expect(secondRegion?.textContent).toBe("second");
  });

  it("re-announces the same message by clearing then re-setting, one frame apart", async () => {
    announce("repeat me");
    await flushAnnounceFrame();
    expect(document.querySelector(".sr-live")?.textContent).toBe("repeat me");

    announce("repeat me");
    // Immediately after the call (before the frame flush), the region must have been cleared —
    // this is exactly what lets AT re-announce an unchanged message.
    expect(document.querySelector(".sr-live")?.textContent).toBe("");

    await flushAnnounceFrame();
    expect(document.querySelector(".sr-live")?.textContent).toBe("repeat me");
  });

  it("recreates the region if it was ever removed from the document", async () => {
    announce("first");
    await flushAnnounceFrame();
    document.body.innerHTML = ""; // ? simulates the region being detached by some unrelated DOM reset

    announce("after detach");
    await flushAnnounceFrame();

    const region = document.querySelector(".sr-live");
    expect(region).not.toBeNull();
    expect(region?.textContent).toBe("after detach");
  });
});
