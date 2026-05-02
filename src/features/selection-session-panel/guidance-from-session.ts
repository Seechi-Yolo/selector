import type { SelectionSessionState } from "../../entities/selection-session";
import { clipboardAuxiliaryHintsVisible } from "../../entities/selection-session";

/** 单条辅引导（可含键位，由面板用 `kbd` 渲染） */
export interface SessionGuidanceSecondary {
  id: string;
  /** 若含「Space」「Esc」「C」等，面板侧可替换为 kbd（当前实现为纯中文句） */
  text: string;
}

export interface SessionGuidanceView {
  primaryText: string;
  primaryUseShiny: boolean;
  secondaries: SessionGuidanceSecondary[];
}

/**
 * PRD D-09：一主多辅；辅条随附录 A 场景变化。
 * D-15：复制相关辅句由 `userHasManualCopiedOnce` 控制。
 */
export function guidanceFromSession(input: {
  session: SelectionSessionState;
  userHasManualCopiedOnce: boolean;
}): SessionGuidanceView {
  const { session, userHasManualCopiedOnce } = input;
  const { picking, selectionCount, instructionOpen, activeLayer, wholeSetFlow } = session;
  const secondaries: SessionGuidanceSecondary[] = [];

  if (selectionCount === 0) {
    if (picking === "paused") {
      secondaries.push({ id: "space", text: "按 Space 继续选取" });
      return {
        primaryText: "已暂停点选。恢复后可继续点击页面添加选取。",
        primaryUseShiny: true,
        secondaries,
      };
    }
    return {
      primaryText: "在页面上点击要修改的元素，开始本次选取。",
      primaryUseShiny: true,
      secondaries,
    };
  }

  if (picking === "paused") {
    secondaries.push({ id: "space", text: "按 Space 恢复点选" });
    secondaries.push({ id: "esc", text: "按 Esc 关闭说明或清空选取" });
    return {
      primaryText: "已暂停选取；页上为灰色描边。恢复后可继续点选与使用「编辑说明」。",
      primaryUseShiny: false,
      secondaries,
    };
  }

  if (!instructionOpen) {
    if (selectionCount >= 2 && wholeSetFlow === "whole_required") {
      secondaries.push({
        id: "whole",
        text: "多选须先完成「对当前选取的说明」，再逐项编写「修改说明」。",
      });
    } else if (selectionCount === 1) {
      secondaries.push({
        id: "arrows",
        text: "方向键可在结构中移动当前焦点项。",
      });
    }
    secondaries.push({ id: "space", text: "按 Space 暂停 / 继续点选" });
    secondaries.push({ id: "esc", text: "按 Esc 关闭说明或清空选取" });
    if (clipboardAuxiliaryHintsVisible(userHasManualCopiedOnce)) {
      secondaries.push({
        id: "clip",
        text: "已自动同步复制提示词；也可用 ⌘/Ctrl+C 再次复制同文。",
      });
    }
    return {
      primaryText: "需要说明时，请点击页上「编辑说明」（逐项或包络角标）。",
      primaryUseShiny: false,
      secondaries,
    };
  }

  if (activeLayer === "whole_set") {
    secondaries.push({ id: "space", text: "按 Space 暂停 / 继续点选" });
    secondaries.push({ id: "esc", text: "按 Esc 关闭说明（连续 Esc 规则见选取会话 PRD）" });
    if (clipboardAuxiliaryHintsVisible(userHasManualCopiedOnce)) {
      secondaries.push({
        id: "clip",
        text: "已自动同步复制提示词；也可用 ⌘/Ctrl+C 再次复制同文。",
      });
    }
    return {
      primaryText:
        wholeSetFlow === "whole_required"
          ? "请先完成「对当前选取的说明」：在下方输入后点「完成」，或点「关闭」稍后再改。"
          : "可继续编辑「对当前选取的说明」，或关闭后点逐项角标编写「修改说明」。",
      primaryUseShiny: false,
      secondaries,
    };
  }

  secondaries.push({ id: "space", text: "按 Space 暂停 / 继续点选" });
  secondaries.push({ id: "esc", text: "按 Esc 关闭说明" });
  if (clipboardAuxiliaryHintsVisible(userHasManualCopiedOnce)) {
    secondaries.push({
      id: "clip",
      text: "已自动同步复制提示词；也可用 ⌘/Ctrl+C 再次复制同文。",
    });
  }
  return {
    primaryText: "正在编辑「修改说明」。「完成」关闭本条；「清除」只清空正文。",
    primaryUseShiny: false,
    secondaries,
  };
}
