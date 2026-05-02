import { describe, expect, it } from "vitest";
import { createSessionReduceSeed, reduceSelectionSession } from "../../entities/selection-session";
import { mapSelectionSessionToPresentation } from "./map-selection-session-to-presentation";

describe("mapSelectionSessionToPresentation", () => {
  it("Given 空选+未暂停 Then primaryScene 为 empty_active 且 D-07 关闭常驻复制", () => {
    const { state } = createSessionReduceSeed();
    const p = mapSelectionSessionToPresentation({ session: state, userHasManualCopiedOnce: false });
    expect(p.guidance.primaryScene).toBe("empty_active");
    expect(p.chrome.persistentCopyPromptButton).toBe(false);
    expect(p.layout.stacking).toBe("selected_content_then_operational_guidance");
  });

  it("Given 多选整体闸未释放 Then wholeSetGate 为 blocked_until_done", () => {
    let { state, clipboard } = createSessionReduceSeed();
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "marquee_commit",
      count: 2,
      focusElementId: "a",
      atMs: 0,
    }));
    const p = mapSelectionSessionToPresentation({ session: state, userHasManualCopiedOnce: false });
    expect(p.wholeSetGate).toBe("blocked_until_done");
    expect(p.instructionSurface).toBe("closed");
  });

  it("Given D-15 未手动复制 Then 不展示剪贴板辅句", () => {
    const { state } = createSessionReduceSeed();
    const p = mapSelectionSessionToPresentation({ session: state, userHasManualCopiedOnce: false });
    expect(p.guidance.showClipboardAuxiliaryHints).toBe(false);
  });
});
