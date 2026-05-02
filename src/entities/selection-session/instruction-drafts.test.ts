import { describe, expect, it } from "vitest";
import { clearPerItemDraft, clearWholeSetDraft, setWholeSetDraft } from "./instruction-drafts";

describe("Instruction drafts (D-18)", () => {
  it("Given 整体草稿 When clearWholeSetDraft Then 正文为空", () => {
    const d = setWholeSetDraft({ selectionLevelBody: "", perItemBodies: {} }, "x");
    expect(clearWholeSetDraft(d).selectionLevelBody).toBe("");
  });

  it("Given 逐项草稿 When clearPerItemDraft Then 移除该键", () => {
    const d0 = { selectionLevelBody: "", perItemBodies: { a: "t" } };
    const d1 = clearPerItemDraft(d0, "a");
    expect(d1.perItemBodies.a).toBeUndefined();
  });
});
