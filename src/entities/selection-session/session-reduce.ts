import { CONSECUTIVE_EXIT_WINDOW_MS } from "./session-constants";
import {
  initialClipboardWriteIntent,
  scheduleClipboardAfterPromptChange,
  type ClipboardWriteIntent,
} from "./clipboard-write-intent";
import {
  clearPerItemDraft,
  clearWholeSetDraft,
  finalizeDraftsUnchanged,
  setPerItemDraft,
  setWholeSetDraft,
} from "./instruction-drafts";
import { draftsAfterSelectionCountCommit } from "./selection-draft-policy";
import type { SelectionSessionState } from "./session-model";
import { initialSelectionSessionState } from "./session-model";
import type { SessionEvent } from "./session-events";

export type SessionEffect =
  | { type: "clipboard_schedule_changed"; flushAtMs: number | null }
  | { type: "instruction_closed"; cause: "esc" | "surface" }
  | { type: "selection_cleared" };

export interface SessionReduceOutput {
  state: SelectionSessionState;
  clipboard: ClipboardWriteIntent;
  effects: SessionEffect[];
}

function applyEscSlice(
  state: Pick<
    SelectionSessionState,
    "selectionCount" | "instructionOpen" | "escClearGate" | "escGateSetAtMs"
  >,
  nowMs: number,
): {
  next: Pick<
    SelectionSessionState,
    "selectionCount" | "instructionOpen" | "escClearGate" | "escGateSetAtMs"
  >;
  instructionClosed: boolean;
  selectionCleared: boolean;
} {
  const hasSelection = state.selectionCount > 0;

  if (!hasSelection && !state.instructionOpen) {
    return { next: state, instructionClosed: false, selectionCleared: false };
  }

  if (state.instructionOpen) {
    return {
      next: {
        selectionCount: state.selectionCount,
        instructionOpen: false,
        escClearGate: "need_extra_esc_before_clear",
        escGateSetAtMs: nowMs,
      },
      instructionClosed: true,
      selectionCleared: false,
    };
  }

  if (!hasSelection) {
    return { next: state, instructionClosed: false, selectionCleared: false };
  }

  if (
    state.escClearGate === "need_extra_esc_before_clear" &&
    state.escGateSetAtMs != null &&
    nowMs - state.escGateSetAtMs <= CONSECUTIVE_EXIT_WINDOW_MS
  ) {
    return {
      next: {
        selectionCount: state.selectionCount,
        instructionOpen: false,
        escClearGate: "none",
        escGateSetAtMs: null,
      },
      instructionClosed: false,
      selectionCleared: false,
    };
  }

  return {
    next: {
      selectionCount: 0,
      instructionOpen: false,
      escClearGate: "none",
      escGateSetAtMs: null,
    },
    instructionClosed: false,
    selectionCleared: true,
  };
}

function commitSelectionSnapshot(prev: SelectionSessionState, count: number, focusElementId: string | null): SelectionSessionState {
  if (count === 0) {
    return initialSelectionSessionState();
  }

  const drafts = draftsAfterSelectionCountCommit({
    drafts: prev.drafts,
    previousCount: prev.selectionCount,
    nextCount: count,
  });

  if (count === 1) {
    return {
      ...prev,
      selectionCount: 1,
      focusElementId,
      formation: { kind: "idle" },
      instructionOpen: true,
      activeLayer: "per_item",
      wholeSetFlow: "idle",
      escClearGate: "none",
      escGateSetAtMs: null,
      drafts,
    };
  }

  return {
    ...prev,
    selectionCount: count,
    focusElementId,
    formation: { kind: "idle" },
    instructionOpen: true,
    activeLayer: "whole_set",
    wholeSetFlow: "whole_required",
    escClearGate: "none",
    escGateSetAtMs: null,
    drafts,
  };
}

function mergeClipboard(
  prevState: SelectionSessionState,
  nextState: SelectionSessionState,
  prevClip: ClipboardWriteIntent,
  atMs: number,
): { clipboard: ClipboardWriteIntent; effects: SessionEffect[] } {
  const driving =
    prevState.selectionCount !== nextState.selectionCount ||
    prevState.focusElementId !== nextState.focusElementId ||
    prevState.drafts.selectionLevelBody !== nextState.drafts.selectionLevelBody ||
    prevState.drafts.perItemBodies !== nextState.drafts.perItemBodies;

  if (!driving) {
    return { clipboard: prevClip, effects: [] };
  }
  const clipboard = scheduleClipboardAfterPromptChange(prevClip, nextState, atMs);
  return { clipboard, effects: [{ type: "clipboard_schedule_changed", flushAtMs: clipboard.flushAtMs }] };
}

export function reduceSelectionSession(
  state: SelectionSessionState,
  clipboard: ClipboardWriteIntent,
  event: SessionEvent,
): SessionReduceOutput {
  let next = state;
  let clip = clipboard;
  const effects: SessionEffect[] = [];

  switch (event.type) {
    case "marquee_begin": {
      next = {
        ...next,
        formation: { kind: "marquee" },
        instructionOpen: false,
        escClearGate: "none",
        escGateSetAtMs: null,
      };
      return { state: next, clipboard: clip, effects };
    }
    case "marquee_commit": {
      next = commitSelectionSnapshot(next, event.count, event.focusElementId);
      const m = mergeClipboard(state, next, clip, event.atMs);
      clip = m.clipboard;
      effects.push(...m.effects);
      return { state: next, clipboard: clip, effects };
    }
    case "shift_selection_change": {
      if (event.count === 0) {
        next = initialSelectionSessionState();
        const mz = mergeClipboard(state, next, clip, event.atMs);
        clip = mz.clipboard;
        effects.push(...mz.effects);
        return { state: next, clipboard: clip, effects };
      }
      next = {
        ...next,
        selectionCount: event.count,
        focusElementId: event.focusElementId,
        formation: { kind: "shift_pending", lastChangeAtMs: event.atMs },
        instructionOpen: false,
      };
      const m = mergeClipboard(state, next, clip, event.atMs);
      clip = m.clipboard;
      effects.push(...m.effects);
      return { state: next, clipboard: clip, effects };
    }
    case "shift_quiet_commit": {
      next = commitSelectionSnapshot(next, event.count, event.focusElementId);
      const m = mergeClipboard(state, next, clip, event.atMs);
      clip = m.clipboard;
      effects.push(...m.effects);
      return { state: next, clipboard: clip, effects };
    }
    case "immediate_select": {
      next = { ...next, formation: { kind: "idle" } };
      next = commitSelectionSnapshot(next, event.count, event.focusElementId);
      const m = mergeClipboard(state, next, clip, event.atMs);
      clip = m.clipboard;
      effects.push(...m.effects);
      return { state: next, clipboard: clip, effects };
    }
    case "selection_pruned": {
      const drafts = draftsAfterSelectionCountCommit({
        drafts: next.drafts,
        previousCount: next.selectionCount,
        nextCount: event.count,
      });
      const wholeSetFlow: SelectionSessionState["wholeSetFlow"] =
        event.count < 2
          ? "idle"
          : next.wholeSetFlow === "whole_done"
            ? "whole_done"
            : next.wholeSetFlow === "whole_required"
              ? "whole_required"
              : "whole_required";
      next = {
        ...next,
        selectionCount: event.count,
        focusElementId: event.focusElementId,
        formation: { kind: "idle" },
        instructionOpen: false,
        activeLayer: event.count >= 2 ? "whole_set" : "per_item",
        wholeSetFlow,
        escClearGate: "none",
        escGateSetAtMs: null,
        drafts,
      };
      const m = mergeClipboard(state, next, clip, event.atMs);
      clip = m.clipboard;
      effects.push(...m.effects);
      return { state: next, clipboard: clip, effects };
    }
    case "clear_selection": {
      next = initialSelectionSessionState();
      const m = mergeClipboard(state, next, clip, event.atMs);
      clip = m.clipboard;
      effects.push(...m.effects, { type: "selection_cleared" });
      return { state: next, clipboard: clip, effects };
    }
    case "toggle_pause": {
      next = { ...next, picking: next.picking === "active" ? "paused" : "active" };
      return { state: next, clipboard: clip, effects };
    }
    case "focus_change": {
      if (next.selectionCount === 0) {
        return { state: next, clipboard: clip, effects };
      }
      next = {
        ...next,
        focusElementId: event.focusElementId,
        instructionOpen: false,
        escClearGate: "none",
        escGateSetAtMs: null,
      };
      return { state: next, clipboard: clip, effects };
    }
    case "open_instruction_via_edit_badge": {
      if (next.selectionCount < 1) {
        return { state: next, clipboard: clip, effects };
      }
      if (next.selectionCount >= 2 && next.wholeSetFlow !== "whole_done") {
        return { state: next, clipboard: clip, effects };
      }
      next = {
        ...next,
        instructionOpen: true,
        activeLayer: "per_item",
        escClearGate: "none",
        escGateSetAtMs: null,
      };
      return { state: next, clipboard: clip, effects };
    }
    case "instruction_surface_close": {
      if (!next.instructionOpen) {
        return { state: next, clipboard: clip, effects };
      }
      next = {
        ...next,
        instructionOpen: false,
        escClearGate: "none",
        escGateSetAtMs: null,
      };
      effects.push({ type: "instruction_closed", cause: "surface" });
      return { state: next, clipboard: clip, effects };
    }
    case "esc": {
      const esc = applyEscSlice(next, event.atMs);
      if (esc.instructionClosed) {
        effects.push({ type: "instruction_closed", cause: "esc" });
      }
      if (esc.selectionCleared) {
        effects.push({ type: "selection_cleared" });
        next = initialSelectionSessionState();
      } else {
        next = {
          ...next,
          selectionCount: esc.next.selectionCount,
          instructionOpen: esc.next.instructionOpen,
          escClearGate: esc.next.escClearGate,
          escGateSetAtMs: esc.next.escGateSetAtMs,
        };
      }
      const m = mergeClipboard(state, next, clip, event.atMs);
      clip = m.clipboard;
      effects.push(...m.effects);
      return { state: next, clipboard: clip, effects };
    }
    case "finalize_whole_set_instruction": {
      if (next.wholeSetFlow !== "whole_required") {
        return { state: next, clipboard: clip, effects };
      }
      next = {
        ...next,
        wholeSetFlow: "whole_done",
        instructionOpen: false,
        drafts: finalizeDraftsUnchanged(next.drafts),
      };
      return { state: next, clipboard: clip, effects };
    }
    case "draft_set_text": {
      if (event.scope === "whole_set") {
        next = { ...next, drafts: setWholeSetDraft(next.drafts, event.text) };
      } else {
        const id = event.elementId;
        if (!id) return { state: next, clipboard: clip, effects };
        next = { ...next, drafts: setPerItemDraft(next.drafts, id, event.text) };
      }
      const m = mergeClipboard(state, next, clip, event.atMs);
      clip = m.clipboard;
      effects.push(...m.effects);
      return { state: next, clipboard: clip, effects };
    }
    case "draft_clear": {
      if (event.scope === "whole_set") {
        next = { ...next, drafts: clearWholeSetDraft(next.drafts) };
      } else {
        const id = event.elementId;
        if (!id) return { state: next, clipboard: clip, effects };
        next = { ...next, drafts: clearPerItemDraft(next.drafts, id) };
      }
      const m = mergeClipboard(state, next, clip, event.atMs);
      clip = m.clipboard;
      effects.push(...m.effects);
      return { state: next, clipboard: clip, effects };
    }
  }
}

export function createSessionReduceSeed(): {
  state: SelectionSessionState;
  clipboard: ClipboardWriteIntent;
} {
  return { state: initialSelectionSessionState(), clipboard: initialClipboardWriteIntent() };
}
