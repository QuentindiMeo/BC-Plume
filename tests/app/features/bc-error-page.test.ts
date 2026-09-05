// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";

import { isBcErrorPage } from "@/app/features/bc-diagnostic";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("isBcErrorPage", () => {
  it("detects Bandcamp's generic error page for an unknown tralbum", () => {
    document.body.innerHTML = `
      <div id="pgBd" class="yui-skin-sam">
        <div class="content">
          <h2>Sorry, that thing isn't here.</h2>
          <p>Please start over.</p>
        </div>
      </div>
    `;

    expect(isBcErrorPage()).toBe(true);
  });

  it("returns false on a regular tralbum page", () => {
    document.body.innerHTML = `
      <div id="pgBd">
        <div id="name-section"></div>
        <div class="trackView"></div>
      </div>
    `;

    expect(isBcErrorPage()).toBe(false);
  });

  it("returns false when #pgBd is entirely absent", () => {
    document.body.innerHTML = "";

    expect(isBcErrorPage()).toBe(false);
  });
});
