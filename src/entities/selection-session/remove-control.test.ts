import { describe, expect, it } from "vitest";
import { REMOVE_CONFIRM_WINDOW_MS } from "./session-constants";
import { applyRemoveClick, initialRemoveArm } from "./remove-control";

describe("Remove control (D-21)", () => {
  it("Given 双次点击同项 Then 第二次执行移除", () => {
    const r1 = applyRemoveClick(initialRemoveArm(), "a", 0, REMOVE_CONFIRM_WINDOW_MS);
    expect(r1.executeRemove).toBe(false);
    const r2 = applyRemoveClick(r1.next, "a", 10, REMOVE_CONFIRM_WINDOW_MS);
    expect(r2.executeRemove).toBe(true);
  });
});
