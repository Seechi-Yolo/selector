import { describe, expect, it } from "vitest";
import { CONSECUTIVE_EXIT_WINDOW_MS } from "./session-constants";
import { createSessionReduceSeed, reduceSelectionSession } from "./session-reduce";

describe("Selection session reducer (appendix A, D-10–D-13, D-11)", () => {
  it("Given 空会话 When immediate_select 一项 Then 默认 N（不自动开说明）且 wholeSetFlow idle", () => {
    let { state, clipboard } = createSessionReduceSeed();
    const out = reduceSelectionSession(state, clipboard, {
      type: "immediate_select",
      count: 1,
      focusElementId: "a",
      atMs: 0,
    });
    expect(out.state.selectionCount).toBe(1);
    expect(out.state.instructionOpen).toBe(false);
    expect(out.state.activeLayer).toBe("per_item");
    expect(out.state.wholeSetFlow).toBe("idle");
    ({ state, clipboard } = out);
    expect(clipboard.flushAtMs).toBe(500);
  });

  it("Given 框选形成期 When marquee_commit ≥2 Then 默认 N 且 whole_required", () => {
    let { state, clipboard } = createSessionReduceSeed();
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, { type: "marquee_begin" }));
    const out = reduceSelectionSession(state, clipboard, {
      type: "marquee_commit",
      count: 2,
      focusElementId: "b",
      atMs: 10,
    });
    expect(out.state.instructionOpen).toBe(false);
    expect(out.state.activeLayer).toBe("whole_set");
    expect(out.state.wholeSetFlow).toBe("whole_required");
  });

  it("Given Shift 追加 When shift_selection_change Then 不打开 O（形成期）", () => {
    let { state, clipboard } = createSessionReduceSeed();
    const out = reduceSelectionSession(state, clipboard, {
      type: "shift_selection_change",
      count: 2,
      focusElementId: "x",
      atMs: 100,
    });
    expect(out.state.formation.kind).toBe("shift_pending");
    expect(out.state.instructionOpen).toBe(false);
  });

  it("Given Shift 安静期提交 When shift_quiet_commit Then 默认 N 且 whole_required", () => {
    let { state, clipboard } = createSessionReduceSeed();
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "shift_selection_change",
      count: 2,
      focusElementId: "x",
      atMs: 0,
    }));
    const out = reduceSelectionSession(state, clipboard, {
      type: "shift_quiet_commit",
      count: 2,
      focusElementId: "x",
      atMs: 600,
    });
    expect(out.state.instructionOpen).toBe(false);
    expect(out.state.activeLayer).toBe("whole_set");
  });

  it("Given H+O When Esc Then 关板不关选取并进入闩", () => {
    let { state, clipboard } = createSessionReduceSeed();
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "immediate_select",
      count: 1,
      focusElementId: "a",
      atMs: 0,
    }));
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "open_instruction_via_edit_badge",
      atMs: 1,
    }));
    const out = reduceSelectionSession(state, clipboard, { type: "esc", atMs: 50 });
    expect(out.state.instructionOpen).toBe(false);
    expect(out.state.selectionCount).toBe(1);
    expect(out.state.escClearGate).toBe("need_extra_esc_before_clear");
    expect(out.effects.some((e) => e.type === "instruction_closed" && e.cause === "esc")).toBe(true);
  });

  it("Given H+O When instruction_surface_close Then N 且无 Esc 闩", () => {
    let { state, clipboard } = createSessionReduceSeed();
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "immediate_select",
      count: 1,
      focusElementId: "a",
      atMs: 0,
    }));
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "open_instruction_via_edit_badge",
      atMs: 1,
    }));
    const out = reduceSelectionSession(state, clipboard, { type: "instruction_surface_close", atMs: 10 });
    expect(out.state.instructionOpen).toBe(false);
    expect(out.state.escClearGate).toBe("none");
    expect(out.effects.some((e) => e.type === "instruction_closed" && e.cause === "surface")).toBe(true);
  });

  it("Given H+O When marquee_begin Then 关说明为 N（形成期不打断为步步 O）", () => {
    let { state, clipboard } = createSessionReduceSeed();
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "immediate_select",
      count: 1,
      focusElementId: "a",
      atMs: 0,
    }));
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "open_instruction_via_edit_badge",
      atMs: 1,
    }));
    const out = reduceSelectionSession(state, clipboard, { type: "marquee_begin" });
    expect(out.state.instructionOpen).toBe(false);
    expect(out.state.formation.kind).toBe("marquee");
  });

  it("Given H+N 且闩内 When Esc Then 只摘闩", () => {
    let { state, clipboard } = createSessionReduceSeed();
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "immediate_select",
      count: 1,
      focusElementId: "a",
      atMs: 0,
    }));
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "open_instruction_via_edit_badge",
      atMs: 1,
    }));
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, { type: "esc", atMs: 0 }));
    const out = reduceSelectionSession(state, clipboard, {
      type: "esc",
      atMs: CONSECUTIVE_EXIT_WINDOW_MS - 1,
    });
    expect(out.state.selectionCount).toBe(1);
    expect(out.state.escClearGate).toBe("none");
  });

  it("Given H+N 无 Esc 闩 When Esc Then 单次清空选取（D-10）", () => {
    let { state, clipboard } = createSessionReduceSeed();
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "immediate_select",
      count: 1,
      focusElementId: "a",
      atMs: 0,
    }));
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, { type: "focus_change", focusElementId: "a" }));
    const out = reduceSelectionSession(state, clipboard, { type: "esc", atMs: 1 });
    expect(out.state.selectionCount).toBe(0);
    expect(out.effects.some((e) => e.type === "selection_cleared")).toBe(true);
  });

  it("Given H+O When focus_change Then 说明关 N", () => {
    let { state, clipboard } = createSessionReduceSeed();
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "immediate_select",
      count: 2,
      focusElementId: "a",
      atMs: 0,
    }));
    const out = reduceSelectionSession(state, clipboard, { type: "focus_change", focusElementId: "b" });
    expect(out.state.instructionOpen).toBe(false);
    expect(out.state.focusElementId).toBe("b");
  });

  it("Given 多选整体未完成 When 编辑说明角标 Then 不切到逐项层", () => {
    let { state, clipboard } = createSessionReduceSeed();
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "marquee_commit",
      count: 2,
      focusElementId: "a",
      atMs: 0,
    }));
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "open_whole_set_instruction_badge",
      atMs: 1,
    }));
    const out = reduceSelectionSession(state, clipboard, { type: "open_instruction_via_edit_badge", atMs: 2 });
    expect(out.state.instructionOpen).toBe(true);
    expect(out.state.activeLayer).toBe("whole_set");
    expect(out.state.wholeSetFlow).toBe("whole_required");
  });

  it("Given 整体已定稿 When 编辑说明角标 Then 打开逐项 O", () => {
    let { state, clipboard } = createSessionReduceSeed();
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "marquee_commit",
      count: 2,
      focusElementId: "a",
      atMs: 0,
    }));
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "open_whole_set_instruction_badge",
      atMs: 1,
    }));
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, { type: "finalize_whole_set_instruction" }));
    const out = reduceSelectionSession(state, clipboard, { type: "open_instruction_via_edit_badge", atMs: 2 });
    expect(out.state.instructionOpen).toBe(true);
    expect(out.state.activeLayer).toBe("per_item");
  });

  it("Given 多选 When selection_pruned Then 关 O 且保留 whole_done 闸", () => {
    let { state, clipboard } = createSessionReduceSeed();
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "marquee_commit",
      count: 3,
      focusElementId: "c",
      atMs: 0,
    }));
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, { type: "finalize_whole_set_instruction" }));
    const out = reduceSelectionSession(state, clipboard, {
      type: "selection_pruned",
      count: 2,
      focusElementId: "b",
      atMs: 10,
    });
    expect(out.state.instructionOpen).toBe(false);
    expect(out.state.wholeSetFlow).toBe("whole_done");
    expect(out.state.selectionCount).toBe(2);
  });

  it("Given toggle_pause When 连续触发 Then A/P 切换", () => {
    let { state, clipboard } = createSessionReduceSeed();
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, { type: "toggle_pause" }));
    expect(state.picking).toBe("paused");
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, { type: "toggle_pause" }));
    expect(state.picking).toBe("active");
  });
});

describe("Clipboard intent with session (D-08, 无可写不写)", () => {
  it("Given 已选无草稿 When 选取建立 Then 仍排程（主内容由元素装配）", () => {
    let { state, clipboard } = createSessionReduceSeed();
    const out = reduceSelectionSession(state, clipboard, {
      type: "immediate_select",
      count: 1,
      focusElementId: "a",
      atMs: 0,
    });
    expect(out.clipboard.flushAtMs).toBe(500);
  });

  it("Given 已选 When 写入整体草稿 Then 排程防抖写入", () => {
    let { state, clipboard } = createSessionReduceSeed();
    ({ state, clipboard } = reduceSelectionSession(state, clipboard, {
      type: "marquee_commit",
      count: 2,
      focusElementId: "a",
      atMs: 0,
    }));
    const out = reduceSelectionSession(state, clipboard, {
      type: "draft_set_text",
      scope: "whole_set",
      text: "整体改色",
      atMs: 1_000,
    });
    expect(out.clipboard.flushAtMs).toBe(1_500);
  });
});
