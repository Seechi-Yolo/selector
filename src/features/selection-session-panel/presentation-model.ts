import type { Picking } from "../../entities/selection-session";

/**
 * 选取会话面板 — UI 呈现模型（Application / Presentation 层）。
 *
 * 与领域 `SelectionSessionState` 分离：只描述「如何展示」，不承载业务转移规则。
 * 宿主组件应依赖本类型渲染，通过 `mapSelectionSessionToPresentation` 由领域状态投影得到。
 */

export type GuidancePrimaryScene = "empty_active" | "empty_paused" | "has_selection";

/** 页上选取叠加的语义色（具体色值在 `shared/editor-chrome` / CSS token 实现） */
export type SelectionOverlaySemantic = "selectable" | "paused";

export type InstructionSurfacePresentation = "closed" | "whole_set" | "per_item";

/**
 * 多选时「整体说明」闸在 UI 上的表达：角标/编辑说明是否应指向包络等。
 */
export type WholeSetGatePresentation = "not_applicable" | "blocked_until_done" | "released_for_per_item";

export interface SelectionPanelPresentation {
  layout: {
    /** PRD D-03：上已选内容、下操作引导 */
    stacking: "selected_content_then_operational_guidance";
    /** PRD D-16 仅表达比例意图，像素由宿主/CSS 实现 */
    sizeIntent: { heightScale: 2; widthScale: 1.5 };
  };
  picking: Picking;
  selectionOverlaySemantic: SelectionOverlaySemantic;
  instructionSurface: InstructionSurfacePresentation;
  wholeSetGate: WholeSetGatePresentation;
  guidance: {
    /** 供 i18n/文案层选择主引导场景（D-09 主句来源） */
    primaryScene: GuidancePrimaryScene;
    /** PRD D-15 */
    showClipboardAuxiliaryHints: boolean;
  };
  chrome: {
    /** PRD D-07 */
    persistentCopyPromptButton: false;
  };
}
