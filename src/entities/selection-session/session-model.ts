export type Picking = "active" | "paused";

export type EscClearGate = "none" | "need_extra_esc_before_clear";

export type FormationKind = "idle" | "marquee" | "shift_pending";

export type WholeSetFlow =
  | "idle"
  | "whole_required"
  | "whole_done";

export interface InstructionDrafts {
  selectionLevelBody: string;
  perItemBodies: Record<string, string>;
}

export interface SelectionSessionState {
  picking: Picking;
  selectionCount: number;
  focusElementId: string | null;
  instructionOpen: boolean;
  activeLayer: "whole_set" | "per_item";
  wholeSetFlow: WholeSetFlow;
  formation: { kind: FormationKind; lastChangeAtMs?: number };
  escClearGate: EscClearGate;
  escGateSetAtMs: number | null;
  drafts: InstructionDrafts;
}

export function initialSelectionSessionState(): SelectionSessionState {
  return {
    picking: "active",
    selectionCount: 0,
    focusElementId: null,
    instructionOpen: false,
    activeLayer: "per_item",
    wholeSetFlow: "idle",
    formation: { kind: "idle" },
    escClearGate: "none",
    escGateSetAtMs: null,
    drafts: { selectionLevelBody: "", perItemBodies: {} },
  };
}
