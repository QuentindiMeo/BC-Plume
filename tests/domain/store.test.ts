import { createScenarioRecorder, IScenarioControls } from "@/domain/store";
import { beforeEach, describe, expect, it } from "vitest";

type State = { value: number };
type Action = { type: string };

const INITIAL_STATE: State = { value: 0 };

describe("createScenarioRecorder", () => {
  let recorder: IScenarioControls<State, Action>;

  beforeEach(() => {
    recorder = createScenarioRecorder<State, Action>();
  });

  // -------------------------------------------------------------------------
  // Empty / initial state
  // -------------------------------------------------------------------------

  describe("empty state", () => {
    it("has no entries and cursor at -1", () => {
      const view = recorder.getScenarioView();
      expect(view.entries).toHaveLength(0);
      expect(view.cursor).toBe(-1);
    });

    it("undo returns null when no entries exist", () => {
      expect(recorder.undo(INITIAL_STATE)).toBeNull();
    });

    it("redo returns null when no entries exist", () => {
      expect(recorder.redo()).toBeNull();
    });

    it("replayScenario returns initialState when no entries exist", () => {
      const result = recorder.replayScenario(INITIAL_STATE);
      expect(result).toEqual(INITIAL_STATE);
      expect(recorder.getScenarioView().cursor).toBe(-1);
    });
  });

  // -------------------------------------------------------------------------
  // record
  // -------------------------------------------------------------------------

  describe("record", () => {
    it("appends an entry and moves cursor to last index", () => {
      recorder.record({ type: "INC" }, { value: 1 });

      const view = recorder.getScenarioView();
      expect(view.entries).toHaveLength(1);
      expect(view.entries[0].action).toEqual({ type: "INC" });
      expect(view.entries[0].stateAfter).toEqual({ value: 1 });
      expect(view.cursor).toBe(0);
    });

    it("appends multiple entries in order and advances cursor", () => {
      recorder.record({ type: "A" }, { value: 1 });
      recorder.record({ type: "B" }, { value: 2 });
      recorder.record({ type: "C" }, { value: 3 });

      const view = recorder.getScenarioView();
      expect(view.entries).toHaveLength(3);
      expect(view.cursor).toBe(2);
      expect(view.entries.map((e) => e.stateAfter.value)).toEqual([1, 2, 3]);
    });

    it("stores a snapshot (not a reference) of stateAfter", () => {
      const state: State = { value: 42 };
      recorder.record({ type: "SNAP" }, state);
      state.value = 999;

      expect(recorder.getScenarioView().entries[0].stateAfter.value).toBe(42);
    });
  });

  // -------------------------------------------------------------------------
  // undo
  // -------------------------------------------------------------------------

  describe("undo", () => {
    beforeEach(() => {
      recorder.record({ type: "A" }, { value: 1 });
      recorder.record({ type: "B" }, { value: 2 });
      recorder.record({ type: "C" }, { value: 3 });
    });

    it("moves cursor back and returns the previous stateAfter", () => {
      const result = recorder.undo(INITIAL_STATE);
      expect(result).toEqual({ value: 2 });
      expect(recorder.getScenarioView().cursor).toBe(1);
    });

    it("returns initialState when cursor reaches -1 (undoing first entry)", () => {
      recorder.undo(INITIAL_STATE); // cursor → 1
      recorder.undo(INITIAL_STATE); // cursor → 0
      const result = recorder.undo(INITIAL_STATE); // cursor → -1
      expect(result).toEqual(INITIAL_STATE);
      expect(recorder.getScenarioView().cursor).toBe(-1);
    });

    it("returns null when already at initial state (cursor = -1)", () => {
      recorder.undo(INITIAL_STATE);
      recorder.undo(INITIAL_STATE);
      recorder.undo(INITIAL_STATE); // reaches -1
      const result = recorder.undo(INITIAL_STATE);
      expect(result).toBeNull();
      expect(recorder.getScenarioView().cursor).toBe(-1);
    });
  });

  // -------------------------------------------------------------------------
  // redo
  // -------------------------------------------------------------------------

  describe("redo", () => {
    beforeEach(() => {
      recorder.record({ type: "A" }, { value: 1 });
      recorder.record({ type: "B" }, { value: 2 });
      recorder.record({ type: "C" }, { value: 3 });
    });

    it("moves cursor forward and returns the next stateAfter", () => {
      recorder.undo(INITIAL_STATE); // cursor → 1
      const result = recorder.redo();
      expect(result).toEqual({ value: 3 });
      expect(recorder.getScenarioView().cursor).toBe(2);
    });

    it("returns null when already at the last entry", () => {
      expect(recorder.redo()).toBeNull();
    });

    it("returns null after redoing all the way to the end", () => {
      recorder.undo(INITIAL_STATE); // cursor → 1
      recorder.undo(INITIAL_STATE); // cursor → 0
      recorder.redo(); // cursor → 1
      recorder.redo(); // cursor → 2
      expect(recorder.redo()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Branching: undo then record discards future entries
  // -------------------------------------------------------------------------

  describe("branching (undo then record)", () => {
    it("discards entries beyond cursor when a new entry is recorded", () => {
      recorder.record({ type: "A" }, { value: 1 });
      recorder.record({ type: "B" }, { value: 2 });
      recorder.record({ type: "C" }, { value: 3 });

      recorder.undo(INITIAL_STATE); // cursor → 1 (entry C still exists)
      recorder.record({ type: "D" }, { value: 99 });

      const view = recorder.getScenarioView();
      // Entry C should have been dropped; new branch: A, B, D
      expect(view.entries).toHaveLength(3);
      expect(view.entries[2].action).toEqual({ type: "D" });
      expect(view.cursor).toBe(2);
    });

    it("redo returns null after branching record", () => {
      recorder.record({ type: "A" }, { value: 1 });
      recorder.undo(INITIAL_STATE);
      recorder.record({ type: "B" }, { value: 2 });

      expect(recorder.redo()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // replayScenario
  // -------------------------------------------------------------------------

  describe("replayScenario", () => {
    beforeEach(() => {
      recorder.record({ type: "A" }, { value: 10 });
      recorder.record({ type: "B" }, { value: 20 });
      recorder.record({ type: "C" }, { value: 30 });
    });

    it("defaults to last entry when toIndex is omitted", () => {
      const result = recorder.replayScenario(INITIAL_STATE);
      expect(result).toEqual({ value: 30 });
      expect(recorder.getScenarioView().cursor).toBe(2);
    });

    it("replays to a specific intermediate index", () => {
      const result = recorder.replayScenario(INITIAL_STATE, 1);
      expect(result).toEqual({ value: 20 });
      expect(recorder.getScenarioView().cursor).toBe(1);
    });

    it("replays to the first entry when toIndex is 0", () => {
      const result = recorder.replayScenario(INITIAL_STATE, 0);
      expect(result).toEqual({ value: 10 });
      expect(recorder.getScenarioView().cursor).toBe(0);
    });

    it("returns initialState and sets cursor to -1 when toIndex is -1", () => {
      const result = recorder.replayScenario(INITIAL_STATE, -1);
      expect(result).toEqual(INITIAL_STATE);
      expect(recorder.getScenarioView().cursor).toBe(-1);
    });

    it("clamps toIndex to last entry when toIndex exceeds entry count", () => {
      const result = recorder.replayScenario(INITIAL_STATE, 999);
      expect(result).toEqual({ value: 30 });
      expect(recorder.getScenarioView().cursor).toBe(2);
    });

    it("returns initialState when recorder is empty regardless of toIndex", () => {
      const empty = createScenarioRecorder<State, Action>();
      const result = empty.replayScenario(INITIAL_STATE, 5);
      expect(result).toEqual(INITIAL_STATE);
      expect(empty.getScenarioView().cursor).toBe(-1);
    });
  });

  // -------------------------------------------------------------------------
  // clearScenario
  // -------------------------------------------------------------------------

  describe("clearScenario", () => {
    it("resets entries to [] and cursor to -1", () => {
      recorder.record({ type: "A" }, { value: 1 });
      recorder.record({ type: "B" }, { value: 2 });
      recorder.clearScenario();

      const view = recorder.getScenarioView();
      expect(view.entries).toHaveLength(0);
      expect(view.cursor).toBe(-1);
    });

    it("undo returns null after clear", () => {
      recorder.record({ type: "A" }, { value: 1 });
      recorder.clearScenario();
      expect(recorder.undo(INITIAL_STATE)).toBeNull();
    });

    it("redo returns null after clear", () => {
      recorder.record({ type: "A" }, { value: 1 });
      recorder.clearScenario();
      expect(recorder.redo()).toBeNull();
    });

    it("allows new entries to be recorded after clear", () => {
      recorder.record({ type: "A" }, { value: 1 });
      recorder.clearScenario();
      recorder.record({ type: "B" }, { value: 42 });

      const view = recorder.getScenarioView();
      expect(view.entries).toHaveLength(1);
      expect(view.entries[0].stateAfter).toEqual({ value: 42 });
      expect(view.cursor).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Capacity limit
  // -------------------------------------------------------------------------

  describe("capacity limit", () => {
    it("drops the oldest entry when maxEntries is exceeded", () => {
      const capped = createScenarioRecorder<State, Action>(3);

      capped.record({ type: "A" }, { value: 1 });
      capped.record({ type: "B" }, { value: 2 });
      capped.record({ type: "C" }, { value: 3 });
      capped.record({ type: "D" }, { value: 4 }); // overflows; drops A

      const view = capped.getScenarioView();
      expect(view.entries).toHaveLength(3);
      expect(view.entries[0].stateAfter).toEqual({ value: 2 });
      expect(view.entries[2].stateAfter).toEqual({ value: 4 });
      expect(view.cursor).toBe(2); // still points to last entry
    });

    it("cursor stays at last index after multiple overflow drops", () => {
      const capped = createScenarioRecorder<State, Action>(2);

      for (let i = 1; i <= 5; i++) {
        capped.record({ type: `E${i}` }, { value: i });
      }

      const view = capped.getScenarioView();
      expect(view.entries).toHaveLength(2);
      expect(view.entries[0].stateAfter).toEqual({ value: 4 });
      expect(view.entries[1].stateAfter).toEqual({ value: 5 });
      expect(view.cursor).toBe(1);
    });
  });
});
