import type { InstructionDrafts } from "./session-model";

/** D-18：清除 — 清空正文，不关「壳」由会话层 instructionOpen 表达 */
export function clearWholeSetDraft(drafts: InstructionDrafts): InstructionDrafts {
  return { ...drafts, selectionLevelBody: "" };
}

export function clearPerItemDraft(drafts: InstructionDrafts, elementId: string): InstructionDrafts {
  const next = { ...drafts.perItemBodies };
  delete next[elementId];
  return { ...drafts, perItemBodies: next };
}

export function setWholeSetDraft(drafts: InstructionDrafts, text: string): InstructionDrafts {
  return { ...drafts, selectionLevelBody: text };
}

export function setPerItemDraft(drafts: InstructionDrafts, elementId: string, text: string): InstructionDrafts {
  return { ...drafts, perItemBodies: { ...drafts.perItemBodies, [elementId]: text } };
}

/**
 * D-18：完成 — 本条说明定型（领域层不增删正文，仅作显式事件供宿主记录版本/埋点）。
 * 此处返回相同 drafts；会话 reducer 可关 O 或保持打开由产品决定。
 */
export function finalizeDraftsUnchanged(drafts: InstructionDrafts): InstructionDrafts {
  return drafts;
}
