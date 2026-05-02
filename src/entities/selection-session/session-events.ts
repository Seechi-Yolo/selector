export type SessionEvent =
  | { type: "marquee_begin" }
  | { type: "marquee_commit"; count: number; focusElementId: string | null; atMs: number }
  | { type: "shift_selection_change"; count: number; focusElementId: string | null; atMs: number }
  | { type: "shift_quiet_commit"; count: number; focusElementId: string | null; atMs: number }
  | { type: "immediate_select"; count: number; focusElementId: string | null; atMs: number }
  /** 移除等导致选取缩小但非「重新建立」：关 O、按草稿策略收缩，不自动再开说明 */
  | { type: "selection_pruned"; count: number; focusElementId: string | null; atMs: number }
  | { type: "clear_selection"; atMs: number }
  | { type: "toggle_pause" }
  | { type: "focus_change"; focusElementId: string | null }
  | { type: "open_instruction_via_edit_badge"; atMs: number }
  /** 多选包络角标：打开「对当前选取的说明」层（whole_required / whole_done） */
  | { type: "open_whole_set_instruction_badge"; atMs: number }
  | { type: "esc"; atMs: number }
  /** 附录 A：O → N 的非 Esc 路径（完成 / 关闭 / 失焦关壳等）；不触发 I-11 Esc 闩 */
  | { type: "instruction_surface_close"; atMs: number }
  | { type: "finalize_whole_set_instruction" }
  | { type: "draft_set_text"; scope: "whole_set" | "per_item"; elementId?: string; text: string; atMs: number }
  | { type: "draft_clear"; scope: "whole_set" | "per_item"; elementId?: string; atMs: number }
  /** 撤销选区后由宿主用当前注释与整体草稿对齐会话（不自动打开说明） */
  | {
      type: "sync_session_after_undo";
      count: number;
      focusElementId: string | null;
      perItemBodies: Record<string, string>;
      selectionLevelBody: string;
      atMs: number;
    };
