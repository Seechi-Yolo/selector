import { describe, expect, it } from "vitest";
import { clipboardAuxiliaryHintsVisible, sortGuidanceLines } from "./operational-guidance";

describe("Operational guidance (D-09, D-15)", () => {
  it("D-09 primary 在前", () => {
    const s = sortGuidanceLines([
      { role: "secondary", body: "b" },
      { role: "primary", body: "a" },
    ]);
    expect(s[0].body).toBe("a");
  });

  it("D-15 手动复制前隐藏辅句", () => {
    expect(clipboardAuxiliaryHintsVisible(false)).toBe(false);
    expect(clipboardAuxiliaryHintsVisible(true)).toBe(true);
  });
});
