import { clipboardAuxiliaryHintsVisible } from "../../entities/selection-session";
import type { SelectionSessionState } from "../../entities/selection-session";
import type {
  GuidancePrimaryScene,
  InstructionSurfacePresentation,
  SelectionOverlaySemantic,
  SelectionPanelPresentation,
  WholeSetGatePresentation,
} from "./presentation-model";

function mapInstructionSurface(session: SelectionSessionState): InstructionSurfacePresentation {
  if (!session.instructionOpen) return "closed";
  return session.activeLayer === "whole_set" ? "whole_set" : "per_item";
}

function mapWholeSetGate(session: SelectionSessionState): WholeSetGatePresentation {
  if (session.selectionCount < 2) return "not_applicable";
  if (session.wholeSetFlow === "whole_done") return "released_for_per_item";
  return "blocked_until_done";
}

function mapPrimaryScene(session: SelectionSessionState): GuidancePrimaryScene {
  if (session.selectionCount > 0) return "has_selection";
  return session.picking === "paused" ? "empty_paused" : "empty_active";
}

function mapOverlaySemantic(session: SelectionSessionState): SelectionOverlaySemantic {
  return session.picking === "active" ? "selectable" : "paused";
}

/**
 * 将领域会话状态投影为「只读呈现模型」，供面板与页上叠加渲染。
 *
 * @param userHasManualCopiedOnce — 来自宿主（键盘/菜单复制成功），参与 I-15，**不属于**领域聚合根。
 */
export function mapSelectionSessionToPresentation(input: {
  session: SelectionSessionState;
  userHasManualCopiedOnce: boolean;
}): SelectionPanelPresentation {
  const { session, userHasManualCopiedOnce } = input;

  return {
    layout: {
      stacking: "selected_content_then_operational_guidance",
      sizeIntent: { heightScale: 0.45, widthScale: 0.45 },
    },
    picking: session.picking,
    selectionOverlaySemantic: mapOverlaySemantic(session),
    instructionSurface: mapInstructionSurface(session),
    wholeSetGate: mapWholeSetGate(session),
    guidance: {
      primaryScene: mapPrimaryScene(session),
      showClipboardAuxiliaryHints: clipboardAuxiliaryHintsVisible(userHasManualCopiedOnce),
    },
    chrome: { persistentCopyPromptButton: false },
  };
}
