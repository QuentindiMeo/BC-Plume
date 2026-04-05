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

describe("BcPlayerAdapter.getCurrentTrackUrl", () => {
  let adapter: BcPlayerAdapter;

  beforeEach(() => {
    adapter = new BcPlayerAdapter();
    document.body.innerHTML = "";
  });

  it("returns the href of the a.title_link element", () => {
    const a = document.createElement("a");
    a.className = "title_link";
    a.href = "/track/some-track";
    document.body.appendChild(a);
    expect(adapter.getCurrentTrackUrl()).toContain("/track/some-track");
  });

  it("returns null when no title_link element exists", () => {
    expect(adapter.getCurrentTrackUrl()).toBeNull();
  });
});

describe("BcPlayerAdapter.getTrackPlayabilityMap", () => {
  let adapter: BcPlayerAdapter;

  beforeEach(() => {
    adapter = new BcPlayerAdapter();
    document.body.innerHTML = "";
  });

  const buildTableWithPlayStatus = (rows: { disabled: boolean }[]): void => {
    const table = document.createElement("table");
    table.id = "track_table";
    rows.forEach(({ disabled }) => {
      const tr = document.createElement("tr");
      tr.className = "track_row_view linked";
      const td = document.createElement("td");
      td.className = "play-col";
      const a = document.createElement("a");
      const div = document.createElement("div");
      div.className = disabled ? "play_status disabled" : "play_status";
      a.appendChild(div);
      td.appendChild(a);
      tr.appendChild(td);
      table.appendChild(tr);
    });
    document.body.appendChild(table);
  };

  it("returns true for playable tracks (no disabled class)", () => {
    buildTableWithPlayStatus([{ disabled: false }, { disabled: false }]);
    expect(adapter.getTrackPlayabilityMap()).toEqual([true, true]);
  });

  it("returns false for unplayable tracks (disabled class)", () => {
    buildTableWithPlayStatus([{ disabled: true }, { disabled: true }]);
    expect(adapter.getTrackPlayabilityMap()).toEqual([false, false]);
  });

  it("returns correct mixed playability", () => {
    buildTableWithPlayStatus([{ disabled: true }, { disabled: false }, { disabled: false }, { disabled: true }]);
    expect(adapter.getTrackPlayabilityMap()).toEqual([false, true, true, false]);
  });

  it("falls back to linked class when play_status element is missing", () => {
    const table = document.createElement("table");
    table.id = "track_table";

    const linkedRow = document.createElement("tr");
    linkedRow.className = "track_row_view linked";
    table.appendChild(linkedRow);

    const unlinkedRow = document.createElement("tr");
    unlinkedRow.className = "track_row_view";
    table.appendChild(unlinkedRow);

    document.body.appendChild(table);
    expect(adapter.getTrackPlayabilityMap()).toEqual([true, false]);
  });

  it("returns empty array when no track table exists", () => {
    expect(adapter.getTrackPlayabilityMap()).toEqual([]);
  });
});
