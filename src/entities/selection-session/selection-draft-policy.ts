import type { InstructionDrafts } from "./session-model";

/**
 * PRD D-13：由 1 项增为多项、或由多项回到单项时，整体/逐项草稿与导出模板对齐的策略（领域显式化）。
 *
 * 约定（可随导出模板调整，但须集中在此模块）：
 * - 进入多选提交（nextCount ≥ 2）：清空整体草稿，保留逐项 map。
 * - 回到单项（nextCount === 1）：清空整体草稿，保留逐项 map。
 * - 回到空选：清空整体与逐项。
 *
 * `previousCount` 保留给后续「1→多」合并规则扩展（当前与默认分支一致）。
 */
export function draftsAfterSelectionCountCommit(params: {
  drafts: InstructionDrafts;
  previousCount: number;
  nextCount: number;
}): InstructionDrafts {
  void params.previousCount;
  const { drafts, nextCount } = params;

  if (nextCount === 0) {
    return { selectionLevelBody: "", perItemBodies: {} };
  }

  if (nextCount === 1) {
    return { selectionLevelBody: "", perItemBodies: { ...drafts.perItemBodies } };
  }

  return {
    selectionLevelBody: "",
    perItemBodies: { ...drafts.perItemBodies },
  };
}
