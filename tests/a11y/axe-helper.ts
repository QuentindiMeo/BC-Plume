import axe, { type Result, type RunOptions } from "axe-core";

/** Timeout for tests that call checkA11y — axe.run() is slow under v8 coverage. */
export const AXE_TEST_TIMEOUT = 15_000;

/**
 * axe-core rule configuration tailored for a browser extension widget context.
 * Rules that test full-page document structure or require real CSS are disabled.
 */
const AXE_OPTIONS: RunOptions = {
  rules: {
    "color-contrast": { enabled: false }, // no real CSS in jsdom
    region: { enabled: false }, // extension injects into host page
    "page-has-heading-one": { enabled: false }, // host page concern
    "landmark-one-main": { enabled: false }, // host page concern
    "html-has-lang": { enabled: false }, // host page controls <html lang>
    "document-title": { enabled: false }, // host page controls <title>
    bypass: { enabled: false }, // skip-nav not applicable to widget
  },
};

function formatViolations(violations: Result[]): string {
  if (violations.length === 0) return "";

  const lines = [`${violations.length} accessibility violation(s):\n`];
  for (const v of violations) {
    lines.push(`  ${v.id} (${v.impact}): ${v.help}`);
    for (const node of v.nodes) {
      lines.push(`    - ${node.target.join(", ")}`);
      if (node.failureSummary) {
        for (const line of node.failureSummary.split("\n")) {
          lines.push(`      ${line}`);
        }
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

// axe-core uses a global singleton lock; serialize calls so parallel test files
// sharing the same worker thread don't trigger "Axe is already running".
let queue: Promise<void> = Promise.resolve();

/**
 * Runs axe-core against the given container and throws if any violations are found.
 * Attach the container to `document.body` before calling this function.
 */
export function checkA11y(container: HTMLElement): Promise<void> {
  const run = queue.then(async () => {
    const results = await axe.run(container, AXE_OPTIONS);
    if (results.violations.length > 0) {
      throw new Error(formatViolations(results.violations));
    }
  });
  queue = run.catch(() => {});
  return run;
}
