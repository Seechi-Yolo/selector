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
  return sec("clip", K("⌘/Ctrl+C"), T(" 可复制"));
}

/**
 * PRD D-09 / **D-24**：主句极短；辅句极少。
 * 说明输入框内快捷键见画布浮动层（Enter / ⌘Ctrl+Delete 等），此处不重复。
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
        primaryText: "Space 恢复后点选",
        primaryUseShiny: true,
        secondaries: [sec("space", K("Space"), T(" 继续"))],
      };
    }
    return {
      primaryText: "点击页上加选",
      primaryUseShiny: true,
      secondaries: [],
    };
  }

  if (picking === "paused") {
    const secondaries: SessionGuidanceSecondary[] = [sec("space", K("Space"), T(" 暂停/继续"))];
    const clip = lineClip(userHasManualCopiedOnce);
    if (clip) secondaries.push(clip);
    return {
      primaryText: instructionOpen ? "已暂停，输入在框下" : "已暂停",
      primaryUseShiny: false,
      secondaries,
    };
  }

  if (!instructionOpen) {
    const secondaries: SessionGuidanceSecondary[] = [];
    if (selectionCount >= 2 && wholeSetFlow === "whole_required") {
      secondaries.push(sec("whole", T("先点包络「编辑说明」整段")));
    } else if (selectionCount === 1) {
      secondaries.push(sec("arrows", K("↑↓←→"), T(" 移焦点")));
    }
    secondaries.push(sec("prune", K("Del"), T(" 删项 · "), K("⌘/Ctrl+Del"), T(" 清光")));
    secondaries.push(sec("esc", K("Esc"), T(" 退出/清空")));
    const clip = lineClip(userHasManualCopiedOnce);
    if (clip) secondaries.push(clip);
    return {
      primaryText: "角标开说明",
      primaryUseShiny: false,
      secondaries,
    };
  }

  const secondaries: SessionGuidanceSecondary[] = [];
  const clip = lineClip(userHasManualCopiedOnce);
  if (clip) secondaries.push(clip);

  if (activeLayer === "whole_set") {
    return {
      primaryText: wholeSetFlow === "whole_required" ? "整段说明" : "整段",
      primaryUseShiny: false,
      secondaries,
    };
  }

  return {
    primaryText: "逐项说明",
    primaryUseShiny: false,
    secondaries,
  };
}
