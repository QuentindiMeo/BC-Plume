// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkA11y } from "./axe-helper";

vi.mock("@/shared/i18n", () => ({ getString: (k: string, _args?: string[]) => k }));
vi.mock("@/shared/logger", () => ({ CPL: { INFO: "info", WARN: "warn" }, logger: vi.fn() }));
vi.mock("@/shared/svg", () => ({
  createSafeSvgElement: () => document.createElementNS("http://www.w3.org/2000/svg", "svg"),
}));
vi.mock("@/svg/icons", () => ({ PLUME_SVG: { logo: "" } }));
vi.mock("@/domain/plume", async (importOriginal: () => Promise<Record<string, unknown>>) => {
  const actual = await importOriginal();
  return {
    ...actual,
    PLUME_CONSTANTS: { ...(actual as { PLUME_CONSTANTS: object }).PLUME_CONSTANTS, TOAST_AUTO_DISMISS: 9999 },
  };
});

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("toast accessibility", () => {
  it("basic toast has no a11y violations", async () => {
    const { createToast } = await import("@/app/features/ui/toast");
    const handle = createToast({
      label: "test-toast",
      title: "Test Toast Title",
      description: "Test description",
      duration: 9999,
    });

    const toastContainer = document.getElementById("bpe-toast-container");
    expect(toastContainer).not.toBeNull();
    await checkA11y(toastContainer!);
    handle.cleanup();
  });

  it("toast has role=status and aria-live=polite", async () => {
    const { createToast } = await import("@/app/features/ui/toast");
    const handle = createToast({
      label: "status-toast",
      title: "Status Toast",
      duration: 9999,
    });

    const toast = document.querySelector(".bpe-toast");
    expect(toast?.getAttribute("role")).toBe("status");
    expect(toast?.getAttribute("aria-live")).toBe("polite");
    handle.cleanup();
  });

  it("dismiss button has aria-label", async () => {
    const { createToast } = await import("@/app/features/ui/toast");
    const handle = createToast({
      label: "dismiss-toast",
      title: "Dismissible",
      duration: 9999,
    });

    const dismissBtn = document.querySelector(".bpe-toast__dismiss");
    expect(dismissBtn?.getAttribute("aria-label")).toBeTruthy();
    handle.cleanup();
  });

  it("timer element is aria-hidden", async () => {
    const { createToast } = await import("@/app/features/ui/toast");
    const handle = createToast({
      label: "timer-toast",
      title: "Timer Toast",
      duration: 9999,
    });

    const timer = document.querySelector(".bpe-toast__timer");
    expect(timer?.getAttribute("aria-hidden")).toBe("true");
    handle.cleanup();
  });

  it("toast with CTA link has no a11y violations", async () => {
    const { createToast } = await import("@/app/features/ui/toast");
    const handle = createToast({
      label: "cta-toast",
      title: "CTA Toast",
      description: "Check this out",
      cta: { href: "https://example.com", label: "Learn More" },
      duration: 9999,
    });

    const toastContainer = document.getElementById("bpe-toast-container");
    expect(toastContainer).not.toBeNull();
    await checkA11y(toastContainer!);
    handle.cleanup();
  });
});
