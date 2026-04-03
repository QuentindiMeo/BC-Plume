// @vitest-environment happy-dom
import { BcPlayerAdapter } from "@/infra/adapters/bc-player";
import { beforeEach, describe, expect, it } from "vitest";

describe("BcPlayerAdapter.getTrackRowTitles", () => {
  let adapter: BcPlayerAdapter;

  beforeEach(() => {
    adapter = new BcPlayerAdapter();
    document.body.innerHTML = "";
  });

  const buildTable = (rows: { linked: boolean; title: string }[]): void => {
    const table = document.createElement("table");
    table.id = "track_table";
    rows.forEach(({ linked, title }) => {
      const tr = document.createElement("tr");
      tr.className = `track_row_view${linked ? " linked" : ""}`;
      const td = document.createElement("td");
      const div = document.createElement("div");
      div.className = "title";
      if (linked) {
        const a = document.createElement("a");
        const span = document.createElement("span");
        span.className = "track-title";
        span.textContent = title;
        a.appendChild(span);
        div.appendChild(a);
      } else {
        // unplayable tracks: div.title holds the text directly, no span.track-title
        div.textContent = title;
      }
      td.appendChild(div);
      tr.appendChild(td);
      table.appendChild(tr);
    });
    document.body.appendChild(table);
  };

  it("returns one title per row when all tracks are playable", () => {
    buildTable([
      { linked: true, title: "Track A" },
      { linked: true, title: "Track B" },
      { linked: true, title: "Track C" },
    ]);
    expect(adapter.getTrackRowTitles()).toEqual(["Track A", "Track B", "Track C"]);
  });

  it("returns aligned titles for mixed playable/unplayable rows", () => {
    buildTable([
      { linked: true, title: "Track A" },
      { linked: false, title: "Track B" },
      { linked: true, title: "Track C" },
    ]);
    expect(adapter.getTrackRowTitles()).toEqual(["Track A", "Track B", "Track C"]);
  });

  it("handles an unplayable track as the first row", () => {
    buildTable([
      { linked: false, title: "Intro" },
      { linked: true, title: "Track A" },
    ]);
    expect(adapter.getTrackRowTitles()).toEqual(["Intro", "Track A"]);
  });

  it("returns empty string for a row with no title element", () => {
    const table = document.createElement("table");
    table.id = "track_table";
    const tr = document.createElement("tr");
    tr.className = "track_row_view";
    table.appendChild(tr);
    document.body.appendChild(table);
    expect(adapter.getTrackRowTitles()).toEqual([""]);
  });
});
