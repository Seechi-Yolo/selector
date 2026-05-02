import { describe, expect, it } from "vitest";
import { draftsAfterSelectionCountCommit } from "./selection-draft-policy";

describe("Selection draft policy (D-13)", () => {
  it("Given 多项提交 When 1→2 Then 清空整体保留逐项 map", () => {
    const next = draftsAfterSelectionCountCommit({
      drafts: { selectionLevelBody: "整体旧", perItemBodies: { a: "x" } },
      previousCount: 1,
      nextCount: 2,
    });
    expect(next.selectionLevelBody).toBe("");
    expect(next.perItemBodies.a).toBe("x");
  });

  it("Given 回到空选 When nextCount 0 Then 清空全部", () => {
    const next = draftsAfterSelectionCountCommit({
      drafts: { selectionLevelBody: "w", perItemBodies: { a: "x" } },
      previousCount: 2,
      nextCount: 0,
    });
    expect(next.selectionLevelBody).toBe("");
    expect(Object.keys(next.perItemBodies).length).toBe(0);
  });
});
