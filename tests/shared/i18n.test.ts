import { getString } from "@/shared/i18n";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("getString", () => {
  it("resolves placeholders using the substitutions array", () => {
    const result = getString("LABEL__TRACK_CURRENT", ["3/10"]);
    expect(result).toBe("currently playing (3/10):");
  });

  it("returns the key and warns when the key does not exist", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = getString("KEY_THAT_DOES_NOT_EXIST");
    expect(result).toBe("KEY_THAT_DOES_NOT_EXIST");
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
