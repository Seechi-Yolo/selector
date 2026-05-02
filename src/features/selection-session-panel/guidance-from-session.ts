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

function lineSpaceContinue(): SessionGuidanceSecondary {
  return sec("space", T("按 "), K("Space"), T(" 继续选取"));
}

function lineSpaceToggle(): SessionGuidanceSecondary {
  return sec("space", T("按 "), K("Space"), T(" 暂停 / 继续点选"));
}

function lineEscWhenHasSelection(): SessionGuidanceSecondary {
  return sec("esc", T("按 "), K("Esc"), T(" 关闭说明或清空选取"));
}

function lineEscInstructionOnly(): SessionGuidanceSecondary {
  return sec("esc", T("按 "), K("Esc"), T(" 关闭说明；说明已关时再按可清空选取"));
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
 * PRD D-09：一主多辅；辅条随附录 A（E/H×A/P×N/O）变化。
 * D-15：复制相关辅句由 `userHasManualCopiedOnce` 控制。
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
        primaryText: "已暂停点选。恢复后可继续点击页面添加选取。",
        primaryUseShiny: true,
        secondaries: [lineSpaceContinue()],
      };
    }
    return {
      primaryText: "在页面上点击要修改的元素，开始本次选取。",
      primaryUseShiny: true,
      secondaries: [],
    };
  }

  if (picking === "paused") {
    const secondaries: SessionGuidanceSecondary[] = [];
    if (instructionOpen) {
      secondaries.push(
        sec(
          "paused-o",
          T("已暂停：页上「编辑说明」不可用；本面板内仍可编辑说明、使用列表与「完成」「清除」「关闭」。"),
        ),
      );
    }
    if (!instructionOpen && selectionCount >= 2 && wholeSetFlow === "whole_required") {
      secondaries.push(
        sec("whole", T("多选须先完成「对当前选取的说明」，再逐项编写「修改说明」。")),
      );
    }
    if (!instructionOpen && selectionCount === 1) {
      secondaries.push(sec("arrows", T("方向键（"), K("↑"), T(" "), K("↓"), T(" "), K("←"), T(" "), K("→"), T("）可在结构中移动当前焦点项。")));
    }
    secondaries.push(lineSpaceToggle());
    secondaries.push(lineEscWhenHasSelection());
    const clip = lineClip(userHasManualCopiedOnce);
    if (clip) secondaries.push(clip);
    return {
      primaryText: instructionOpen
        ? "已暂停选取；页上为灰色描边。下方说明仍可在本面板内编辑。"
        : "已暂停选取；页上为灰色描边。恢复后可继续点选与使用「编辑说明」。",
      primaryUseShiny: false,
      secondaries,
    };
  }

  if (!instructionOpen) {
    const secondaries: SessionGuidanceSecondary[] = [];
    if (selectionCount >= 2 && wholeSetFlow === "whole_required") {
      secondaries.push(
        sec("whole", T("多选须先完成「对当前选取的说明」，再逐项编写「修改说明」。")),
      );
    } else if (selectionCount === 1) {
      secondaries.push(
        sec("arrows", T("方向键（"), K("↑"), T(" "), K("↓"), T(" "), K("←"), T(" "), K("→"), T("）可在结构中移动当前焦点项。")),
      );
    }
    secondaries.push(lineSpaceToggle());
    secondaries.push(lineEscWhenHasSelection());
    const clip = lineClip(userHasManualCopiedOnce);
    if (clip) secondaries.push(clip);
    return {
      primaryText: "需要说明时，请点击页上「编辑说明」（逐项或包络角标）。",
      primaryUseShiny: false,
      secondaries,
    };
  }

  if (activeLayer === "whole_set") {
    const secondaries: SessionGuidanceSecondary[] = [
      lineSpaceToggle(),
      lineEscInstructionOnly(),
    ];
    const clip = lineClip(userHasManualCopiedOnce);
    if (clip) secondaries.push(clip);
    return {
      primaryText:
        wholeSetFlow === "whole_required"
          ? "请先完成「对当前选取的说明」：在下方输入后点「完成」，或点「关闭」稍后再改。"
          : "可继续编辑「对当前选取的说明」，或关闭后点逐项角标编写「修改说明」。",
      primaryUseShiny: false,
      secondaries,
    };
  }

  const secondaries: SessionGuidanceSecondary[] = [lineSpaceToggle(), lineEscInstructionOnly()];
  const clip = lineClip(userHasManualCopiedOnce);
  if (clip) secondaries.push(clip);
  return {
    primaryText: "正在编辑「修改说明」。「完成」关闭本条；「清除」只清空正文。",
    primaryUseShiny: false,
    secondaries,
  };
}
