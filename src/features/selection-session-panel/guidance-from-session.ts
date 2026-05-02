import type { SelectionSessionState } from "../../entities/selection-session";
import { clipboardAuxiliaryHintsVisible } from "../../entities/selection-session";

/** 辅句片段：文本或键帽（验收：引导中文 + 键帽形式） */
export type GuidanceChunk = { kind: "text"; value: string } | { kind: "kbd"; value: string };

export interface SessionGuidanceSecondary {
  id: string;
  chunks: GuidanceChunk[];
}

export interface SessionGuidanceView {
  primaryText: string;
  primaryUseShiny: boolean;
  secondaries: SessionGuidanceSecondary[];
}

const T = (value: string): GuidanceChunk => ({ kind: "text", value });
const K = (value: string): GuidanceChunk => ({ kind: "kbd", value });

function sec(id: string, ...chunks: GuidanceChunk[]): SessionGuidanceSecondary {
  return { id, chunks };
}

function lineClip(userHasManualCopiedOnce: boolean): SessionGuidanceSecondary | null {
  if (!clipboardAuxiliaryHintsVisible(userHasManualCopiedOnce)) return null;
  return sec(
    "clip",
    T("已自动同步复制提示词；也可用 "),
    K("⌘/Ctrl"),
    T("+"),
    K("C"),
    T(" 再次复制同文。"),
  );
}

/**
 * PRD D-09 / **D-24**：一主少辅；辅句随附录 A（E/H×A/P×N/O）变化。
 * D-15：复制相关辅句由 `userHasManualCopiedOnce` 控制。
 * D-22 / D-23：说明正文在画布选取框下编辑；Enter / Ctrl+Delete / 点外部等仅在主句概括。
 */
export function guidanceFromSession(input: {
  session: SelectionSessionState;
  userHasManualCopiedOnce: boolean;
}): SessionGuidanceView {
  const { session, userHasManualCopiedOnce } = input;
  const { picking, selectionCount, instructionOpen, activeLayer, wholeSetFlow } = session;

  if (selectionCount === 0) {
    if (picking === "paused") {
      return {
        primaryText: "已暂停点选。按 Space 恢复后再在页上选取。",
        primaryUseShiny: true,
        secondaries: [sec("space", T("按 "), K("Space"), T(" 继续选取"))],
      };
    }
    return {
      primaryText: "在页面上点击要修改的元素，开始本次选取。",
      primaryUseShiny: true,
      secondaries: [],
    };
  }

  if (picking === "paused") {
    const secondaries: SessionGuidanceSecondary[] = [sec("space", T("按 "), K("Space"), T(" 暂停 / 继续"))];
    const clip = lineClip(userHasManualCopiedOnce);
    if (clip) secondaries.push(clip);
    return {
      primaryText: instructionOpen
        ? "已暂停；说明输入在选取框下方，Enter 提交、Ctrl+Delete 清空、点外部取消。"
        : "已暂停；恢复后可继续点选与「编辑说明」。",
      primaryUseShiny: false,
      secondaries,
    };
  }

  if (!instructionOpen) {
    const secondaries: SessionGuidanceSecondary[] = [];
    if (selectionCount >= 2 && wholeSetFlow === "whole_required") {
      secondaries.push(sec("whole", T("多选须先完成整体说明（包络角标），再逐项。")));
    } else if (selectionCount === 1) {
      secondaries.push(sec("arrows", T("单选时可用 "), K("↑↓←→"), T(" 在结构中移动焦点。")));
    }
    secondaries.push(
      sec(
        "prune",
        K("Delete"),
        T(" / "),
        K("Backspace"),
        T(" 移除焦点项；"),
        K("Ctrl+Delete"),
        T(" / "),
        K("⌘+Delete"),
        T(" 清空整次选取。"),
      ),
    );
    secondaries.push(sec("esc", T("按 "), K("Esc"), T(" 关说明或清空选取")));
    const clip = lineClip(userHasManualCopiedOnce);
    if (clip) secondaries.push(clip);
    return {
      primaryText: "需要说明时点页上「编辑说明」；正文在选取框正下方输入。",
      primaryUseShiny: false,
      secondaries,
    };
  }

  const editHint = sec(
    "edit-keys",
    T("输入框下："),
    K("Enter"),
    T(" 提交；"),
    K("Ctrl+Delete"),
    T(" / "),
    K("⌘+Delete"),
    T(" 清空；点外部取消。"),
  );

  if (activeLayer === "whole_set") {
    const secondaries: SessionGuidanceSecondary[] = [editHint];
    const clip = lineClip(userHasManualCopiedOnce);
    if (clip) secondaries.push(clip);
    return {
      primaryText:
        wholeSetFlow === "whole_required"
          ? "编辑「对当前选取的说明」：Enter 完成整体闸；Esc 关层。"
          : "可继续编辑整体说明，或 Enter 关闭后改逐项。",
      primaryUseShiny: false,
      secondaries,
    };
  }

  const secondaries: SessionGuidanceSecondary[] = [editHint];
  const clip = lineClip(userHasManualCopiedOnce);
  if (clip) secondaries.push(clip);
  return {
    primaryText: "编辑「修改说明」：Enter 提交；Esc 关层。",
    primaryUseShiny: false,
    secondaries,
  };
}
