import { saveAnnotation, clearSelectionAnnotation } from "../../features/annotate-selection";
import { buildElementContext, copyPrompt, wouldCopyPromptProduceText } from "../../features/copy-prompt";
import { EditorPanel } from "../../features/editor-panel";
import { tryMountTutorialIntro, type EditorOnboarding } from "../../features/editor-onboarding";
import { SelectionController } from "../../features/select-elements";
import {
  FORMATION_QUIET_MS,
  createSessionReduceSeed,
  reduceSelectionSession,
  unionBounds,
  type AxisRect,
  type ClipboardWriteIntent,
  type SessionEvent,
  type SelectionSessionState,
} from "../../entities/selection-session";
import { BrowserClipboard } from "../../shared/clipboard";
import type { ElementId } from "../../entities/element-selection";
import { rectsIntersect } from "../../shared/dom/geometry";
import {
  assignElementIds,
  byElementId,
  elementId,
  elementLabel,
  isEditorElement,
  isExtensionUiSurface,
  isHostNativeEditableSurface,
  isMeaningful,
  isVisible,
  meaningfulElements,
  resolveTarget,
} from "../../shared/dom/page-elements";
import { EditorChromeTheme } from "../../shared/editor-chrome";
import { NS } from "../../shared/dom/constants";
import {
  InstructionCanvasDock,
  SelectionOverlays,
  type InstructionCanvasDockLayer,
  type SelectionEditBadgeCallbacks,
  type SelectionOverlayViz,
} from "../../shared/ui";

interface ListenerRecord {
  target: EventTarget;
  type: string;
  listener: EventListenerOrEventListenerObject;
  options?: boolean | AddEventListenerOptions;
}

interface DragState {
  startX: number;
  startY: number;
  isDragging: boolean;
  marquee: HTMLDivElement | null;
  marqueeSessionBegan: boolean;
}

export class SelectorContentApp {
  private readonly controller = new SelectionController();
  private readonly clipboard = new BrowserClipboard();
  private readonly overlays = new SelectionOverlays();
  private readonly listeners: ListenerRecord[] = [];
  private panel: EditorPanel | null = null;
  private onboarding: EditorOnboarding | null = null;
  private dragState: DragState | null = null;
  private wasJustDragging = false;
  private rafPending = false;
  private lastMoveTarget: Element | null = null;
  private started = false;

  private session: SelectionSessionState;
  private clipboardIntent: ClipboardWriteIntent;
  private shiftQuietTimer: number | null = null;
  private clipboardFlushTimer: number | null = null;
  private pauseScrim: HTMLDivElement | null = null;
  private instructionDock: InstructionCanvasDock;
  private instructionCopyToastEl: HTMLDivElement | null = null;
  private instructionCopyToastTimer: number | null = null;
  /** D-23：在扩展 UI 外 pointerdown 关闭说明层后，忽略紧随的 click，避免误改选区 */
  private suppressNextClickSelection = false;

  constructor() {
    const seed = createSessionReduceSeed();
    this.session = seed.state;
    this.clipboardIntent = seed.clipboard;

    this.instructionDock = new InstructionCanvasDock({
      onDraftChange: (value) => {
        if (this.session.activeLayer === "whole_set") {
          this.dispatchSession({ type: "draft_set_text", scope: "whole_set", text: value, atMs: Date.now() });
        } else {
          const snap = this.controller.snapshot();
          const fid =
            this.session.focusElementId ?? (snap.selectedIds.length === 1 ? snap.selectedIds[0]! : null);
          if (fid) {
            saveAnnotation(this.controller, fid, value);
            this.dispatchSession({
              type: "draft_set_text",
              scope: "per_item",
              elementId: fid,
              text: value,
              atMs: Date.now(),
            });
          }
        }
        this.render();
      },
      onEnterComplete: () => {
        void this.handleInstructionEnterComplete();
      },
      onCtrlDeleteClear: () => {
        if (this.session.activeLayer === "whole_set") {
          this.dispatchSession({ type: "draft_clear", scope: "whole_set", atMs: Date.now() });
        } else {
          const snap = this.controller.snapshot();
          const fid =
            this.session.focusElementId ?? (snap.selectedIds.length === 1 ? snap.selectedIds[0]! : null);
          if (fid) {
            clearSelectionAnnotation(this.controller, fid);
            this.dispatchSession({
              type: "draft_clear",
              scope: "per_item",
              elementId: fid,
              atMs: Date.now(),
            });
          }
        }
        this.render();
      },
    });
  }

  init(): void {
    if (this.started) return;
    this.started = true;

    EditorChromeTheme.inject();
    assignElementIds(document.body);
    this.overlays.createHoverBox();
    this.panel = new EditorPanel({
      onCopy: () => void this.copySelectionPrompt(),
      onClose: () => this.destroy(),
      onMinimizeChange: () => this.overlays.showHover(null, (id) => this.controller.hasSelection(id)),
      onTagFocusRequest: (tagId) => {
        if (this.session.selectionCount <= 1) return;
        if (this.session.focusElementId === tagId) return;
        this.dispatchSession({ type: "focus_change", focusElementId: tagId });
        this.render();
      },
    });

    this.on(document, "mousedown", (event) => this.handleMouseDown(event as MouseEvent), true);
    this.on(document, "click", (event) => this.handleClick(event as MouseEvent), true);
    this.on(document, "mousemove", (event) => this.handleMouseMove(event as MouseEvent), true);
    this.on(document, "mouseup", (event) => this.handleMouseUp(event as MouseEvent), true);
    this.on(document, "mouseleave", () => {
      this.overlays.showHover(null, (id) => this.controller.hasSelection(id));
      this.cancelDrag();
    }, true);
    this.on(document, "keydown", (event) => this.handleKeyDown(event as KeyboardEvent), true);

    let repositionRaf = false;
    const scheduleReposition = () => {
      if (repositionRaf) return;
      repositionRaf = true;
      requestAnimationFrame(() => {
        this.positionAllOverlays();
        repositionRaf = false;
      });
    };
    this.on(window, "scroll", scheduleReposition, true);
    this.on(window, "resize", scheduleReposition, false);
    this.render();

    void tryMountTutorialIntro(() => this.panel?.element ?? null, () => {
      this.onboarding = null;
    }).then((o) => {
      this.onboarding = o;
    });
  }

  destroy(): void {
    for (const { target, type, listener, options } of this.listeners) {
      target.removeEventListener(type, listener, options);
    }
    this.listeners.length = 0;
    this.clearShiftQuietTimer();
    this.clearClipboardFlushTimer();
    this.cancelDrag();
    this.overlays.destroy();
    this.onboarding?.destroy();
    this.onboarding = null;
    this.pauseScrim?.remove();
    this.pauseScrim = null;
    this.clearInstructionCopyToast();
    this.instructionDock.destroy();
    this.panel?.destroy();
    this.panel = null;
    EditorChromeTheme.remove();
    delete window.__selectorApp;
  }

  private on(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    target.addEventListener(type, listener, options);
    this.listeners.push({ target, type, listener, options });
  }

  private isPaused(): boolean {
    return this.session.picking === "paused";
  }

  private dispatchSession(event: SessionEvent): void {
    const out = reduceSelectionSession(this.session, this.clipboardIntent, event);
    this.session = out.state;
    this.clipboardIntent = out.clipboard;
    for (const eff of out.effects) {
      if (eff.type === "clipboard_schedule_changed") {
        this.scheduleClipboardFlush(eff.flushAtMs);
      }
    }
  }

  private clearShiftQuietTimer(): void {
    if (this.shiftQuietTimer != null) {
      window.clearTimeout(this.shiftQuietTimer);
      this.shiftQuietTimer = null;
    }
  }

  private clearClipboardFlushTimer(): void {
    if (this.clipboardFlushTimer != null) {
      window.clearTimeout(this.clipboardFlushTimer);
      this.clipboardFlushTimer = null;
    }
  }

  private scheduleClipboardFlush(flushAtMs: number | null): void {
    this.clearClipboardFlushTimer();
    if (flushAtMs == null) return;
    const wait = Math.max(0, flushAtMs - Date.now());
    this.clipboardFlushTimer = window.setTimeout(() => {
      this.clipboardFlushTimer = null;
      void this.flushClipboardDebounced();
    }, wait);
  }

  private mergeAnnotationsForPrompt(snap: ReturnType<SelectionController["snapshot"]>): Record<string, string> {
    const out: Record<string, string> = { ...snap.annotations };
    for (const id of snap.selectedIds) {
      if (Object.prototype.hasOwnProperty.call(this.session.drafts.perItemBodies, id)) {
        out[id] = this.session.drafts.perItemBodies[id] ?? "";
      }
    }
    return out;
  }

  private itemHasInstruction(id: string): boolean {
    const snap = this.controller.snapshot();
    const fromCtrl = (snap.annotations[id] ?? "").trim().length > 0;
    const fromDraft = (this.session.drafts.perItemBodies[id] ?? "").trim().length > 0;
    return fromCtrl || fromDraft;
  }

  private overlayViz(): SelectionOverlayViz {
    return {
      paused: this.session.picking === "paused",
      focusId: this.session.focusElementId,
      wholeSetFlow: this.session.wholeSetFlow,
      instructionOpen: this.session.instructionOpen,
    };
  }

  private editBadgeCallbacks(): SelectionEditBadgeCallbacks {
    return {
      onPerItemBadge: (elementId) => this.handlePerItemEditBadge(elementId),
      onUnionWholeBadge: () => this.handleUnionWholeEditBadge(),
    };
  }

  /** 各元素右下角「编辑说明」：多选须在整段放行后才可逐项 */
  private handlePerItemEditBadge(elementId: string): void {
    if (!this.hasSelections() || this.isPaused() || this.session.instructionOpen) return;
    const n = this.session.selectionCount;
    if (n >= 2 && this.session.wholeSetFlow !== "whole_done") return;
    if (this.session.focusElementId !== elementId) {
      this.dispatchSession({ type: "focus_change", focusElementId: elementId });
    }
    this.dispatchSession({ type: "open_instruction_via_edit_badge", atMs: Date.now() });
    this.render();
  }

  /** 多选包络右下角「整段说明」 */
  private handleUnionWholeEditBadge(): void {
    if (!this.hasSelections() || this.isPaused() || this.session.instructionOpen) return;
    if (this.session.selectionCount < 2 || this.session.wholeSetFlow !== "whole_required") return;
    this.dispatchSession({ type: "open_whole_set_instruction_badge", atMs: Date.now() });
    this.render();
  }

  /** 取消防抖后立刻按当前会话写剪贴板；返回是否实际写入非空提示词 */
  private async flushClipboardDebounced(): Promise<boolean> {
    const snap = this.controller.snapshot();
    if (snap.selectedIds.length === 0) return false;
    const overall = this.session.drafts.selectionLevelBody.trim();
    const merged = this.mergeAnnotationsForPrompt(snap);
    if (
      !wouldCopyPromptProduceText({
        selectedIds: snap.selectedIds,
        annotations: merged,
        pagePath: location.pathname,
        contextReader: { read: buildElementContext },
        selectionLevelInstruction: overall.length > 0 ? overall : undefined,
      })
    ) {
      return false;
    }
    return await copyPrompt({
      selectedIds: snap.selectedIds,
      annotations: merged,
      pagePath: location.pathname,
      contextReader: { read: buildElementContext },
      clipboard: this.clipboard,
      selectionLevelInstruction: overall.length > 0 ? overall : undefined,
    });
  }

  /** 说明层 Enter 提交：先关说明层，再立即写剪贴板；成功时在原输入锚点下短暂弹出「已复制提示词」（不经主面板） */
  private async handleInstructionEnterComplete(): Promise<void> {
    const snap = this.controller.snapshot();
    const anchor = this.computeInstructionAnchorRect(snap);

    if (this.session.activeLayer === "whole_set" && this.session.wholeSetFlow === "whole_required") {
      this.dispatchSession({ type: "finalize_whole_set_instruction" });
    } else {
      this.dispatchSession({ type: "instruction_surface_close", atMs: Date.now() });
    }
    this.render();

    this.clearClipboardFlushTimer();
    const copied = await this.flushClipboardDebounced();
    if (copied && anchor != null) {
      this.showInstructionCopyToast(anchor, "已复制提示词");
    }
  }

  private clearInstructionCopyToast(): void {
    if (this.instructionCopyToastTimer != null) {
      window.clearTimeout(this.instructionCopyToastTimer);
      this.instructionCopyToastTimer = null;
    }
    this.instructionCopyToastEl?.remove();
    this.instructionCopyToastEl = null;
  }

  /** 紧贴说明层原锚点（选取框下沿）下方，短暂展示 */
  private showInstructionCopyToast(anchor: DOMRect, message: string): void {
    this.clearInstructionCopyToast();
    const el = document.createElement("div");
    el.className = `${NS}-root ${NS}-instruction-copy-toast`;
    el.setAttribute("role", "status");
    el.textContent = message;
    const maxW = Math.min(280, window.innerWidth - 16, Math.max(160, anchor.width + 48));
    let left = anchor.left + (anchor.width - maxW) / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - maxW - 8));
    el.style.left = `${left}px`;
    el.style.top = `${anchor.bottom + 8}px`;
    el.style.width = `${maxW}px`;
    document.body.appendChild(el);
    this.instructionCopyToastEl = el;
    this.instructionCopyToastTimer = window.setTimeout(() => this.clearInstructionCopyToast(), 2000);
  }

  private scheduleShiftQuietCommit(): void {
    this.clearShiftQuietTimer();
    this.shiftQuietTimer = window.setTimeout(() => {
      this.shiftQuietTimer = null;
      const snap = this.controller.snapshot();
      const n = snap.selectedIds.length;
      if (n === 0) return;
      const focus = snap.selectedIds[n - 1] ?? null;
      this.dispatchSession({
        type: "shift_quiet_commit",
        count: n,
        focusElementId: focus,
        atMs: Date.now(),
      });
      this.render();
    }, FORMATION_QUIET_MS);
  }

  private executeRemoveItem(id: ElementId): void {
    const now = Date.now();
    this.controller.remember();
    this.controller.remove(id);
    const snap = this.controller.snapshot();
    const n = snap.selectedIds.length;
    const focus = n > 0 ? snap.selectedIds[n - 1]! : null;
    if (n === 0) {
      this.dispatchSession({ type: "clear_selection", atMs: now });
    } else {
      this.dispatchSession({ type: "selection_pruned", count: n, focusElementId: focus, atMs: now });
    }
    this.render();
  }

  private removeFocusedItemFromSelection(): void {
    const snap = this.controller.snapshot();
    if (snap.selectedIds.length === 0) return;
    const focus =
      this.session.focusElementId ?? snap.selectedIds[snap.selectedIds.length - 1] ?? null;
    if (!focus || !snap.selectedIds.includes(focus)) return;
    this.executeRemoveItem(focus);
  }

  private clearEntireSelection(): void {
    const now = Date.now();
    this.controller.remember();
    this.controller.clear();
    this.clearShiftQuietTimer();
    this.dispatchSession({ type: "clear_selection", atMs: now });
    this.render();
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.panel?.isMinimized || this.isPaused()) return;

    if (this.dragState) {
      const dx = event.clientX - this.dragState.startX;
      const dy = event.clientY - this.dragState.startY;

      if (!this.dragState.isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        this.dragState.isDragging = true;
        this.clearShiftQuietTimer();
        if (!this.dragState.marqueeSessionBegan) {
          this.dragState.marqueeSessionBegan = true;
          this.dispatchSession({ type: "marquee_begin" });
        }
        this.dragState.marquee = document.createElement("div");
        this.dragState.marquee.className = "ai-editor-marquee";
        document.body.appendChild(this.dragState.marquee);
        this.overlays.showHover(null, (id) => this.controller.hasSelection(id));
      }

      if (this.dragState.isDragging && this.dragState.marquee) {
        const left = Math.min(event.clientX, this.dragState.startX);
        const top = Math.min(event.clientY, this.dragState.startY);
        this.dragState.marquee.style.left = `${left}px`;
        this.dragState.marquee.style.top = `${top}px`;
        this.dragState.marquee.style.width = `${Math.abs(dx)}px`;
        this.dragState.marquee.style.height = `${Math.abs(dy)}px`;
        return;
      }
    }

    this.lastMoveTarget = resolveTarget(event.target);
    if (this.rafPending) return;

    this.rafPending = true;
    requestAnimationFrame(() => {
      this.overlays.showHover(this.lastMoveTarget, (id) => this.controller.hasSelection(id));
      this.rafPending = false;
    });
  }

  private handleMouseDown(event: MouseEvent): void {
    if (
      this.session.instructionOpen &&
      event.button === 0 &&
      !isExtensionUiSurface(event.target)
    ) {
      this.suppressNextClickSelection = true;
      this.dispatchSession({ type: "instruction_surface_close", atMs: Date.now() });
      this.render();
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (isExtensionUiSurface(event.target)) return;
    if (this.panel?.isMinimized || this.isPaused()) return;
    if (event.button !== 0) return;
    if (event.shiftKey) event.preventDefault();

    this.dragState = {
      startX: event.clientX,
      startY: event.clientY,
      isDragging: false,
      marquee: null,
      marqueeSessionBegan: false,
    };
  }

  private handleMouseUp(event: MouseEvent): void {
    if (!this.dragState?.isDragging || !this.dragState.marquee) {
      this.dragState = null;
      return;
    }

    this.wasJustDragging = true;
    const marqueeRect = this.dragState.marquee.getBoundingClientRect();
    this.cancelDrag();

    this.controller.remember();
    if (!event.shiftKey) this.controller.clear();

    const ids = meaningfulElements()
      .filter((el) => rectsIntersect(marqueeRect, el.getBoundingClientRect()))
      .map((el) => elementId(el));
    this.controller.addMany(ids);

    const snap = this.controller.snapshot();
    const n = snap.selectedIds.length;
    const focus = n > 0 ? snap.selectedIds[n - 1]! : null;
    this.dispatchSession({
      type: "marquee_commit",
      count: n,
      focusElementId: focus,
      atMs: Date.now(),
    });

    this.render();
    window.setTimeout(() => {
      this.wasJustDragging = false;
    }, 0);
  }

  private handleClick(event: MouseEvent): void {
    if (isExtensionUiSurface(event.target)) return;
    if (this.suppressNextClickSelection) {
      this.suppressNextClickSelection = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (this.panel?.isMinimized || this.isPaused()) return;
    if (this.wasJustDragging) return;

    event.preventDefault();
    event.stopPropagation();
    window.getSelection()?.removeAllRanges();

    const target = resolveTarget(event.target);
    if (!target) return;

    this.controller.remember();
    const id = elementId(target);
    const at = Date.now();
    if (event.shiftKey) {
      this.controller.toggle(id);
      const snap = this.controller.snapshot();
      const n = snap.selectedIds.length;
      const focus = n > 0 ? snap.selectedIds[n - 1]! : null;
      this.dispatchSession({
        type: "shift_selection_change",
        count: n,
        focusElementId: focus,
        atMs: at,
      });
      this.scheduleShiftQuietCommit();
    } else {
      this.clearShiftQuietTimer();
      this.controller.selectOnly(id);
      this.dispatchSession({ type: "immediate_select", count: 1, focusElementId: id, atMs: at });
    }

    this.render();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      const out = reduceSelectionSession(this.session, this.clipboardIntent, { type: "esc", atMs: Date.now() });
      this.session = out.state;
      this.clipboardIntent = out.clipboard;
      for (const eff of out.effects) {
        if (eff.type === "clipboard_schedule_changed") {
          this.scheduleClipboardFlush(eff.flushAtMs);
        }
        if (eff.type === "selection_cleared") {
          this.controller.remember();
          this.controller.clear();
        }
      }
      this.render();
      return;
    }

    if (
      isExtensionUiSurface(event.target) &&
      event.target instanceof HTMLElement &&
      ["INPUT", "TEXTAREA"].includes(event.target.tagName)
    ) {
      return;
    }

    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !this.session.instructionOpen &&
      this.hasSelections() &&
      !this.isPaused() &&
      !isHostNativeEditableSurface(event.target) &&
      !isExtensionUiSurface(event.target)
    ) {
      event.preventDefault();
      event.stopPropagation();
      const n = this.session.selectionCount;
      if (n >= 2 && this.session.wholeSetFlow === "whole_required") {
        this.dispatchSession({ type: "open_whole_set_instruction_badge", atMs: Date.now() });
      } else {
        this.dispatchSession({ type: "open_instruction_via_edit_badge", atMs: Date.now() });
      }
      this.render();
      return;
    }

    const mod = event.metaKey || event.ctrlKey;

    if (mod && event.key.toLowerCase() === "c" && !event.shiftKey && this.hasSelections()) {
      event.preventDefault();
      void this.copySelectionPrompt();
      return;
    }

    if (mod && event.key.toLowerCase() === "z" && !event.shiftKey) {
      event.preventDefault();
      if (this.controller.undo()) {
        const snap = this.controller.snapshot();
        const n = snap.selectedIds.length;
        const at = Date.now();
        if (n === 0) {
          this.dispatchSession({ type: "clear_selection", atMs: at });
        } else {
          const perItem: Record<string, string> = {};
          for (const id of snap.selectedIds) {
            perItem[id] = snap.annotations[id] ?? "";
          }
          this.dispatchSession({
            type: "sync_session_after_undo",
            count: n,
            focusElementId: snap.selectedIds[n - 1] ?? null,
            perItemBodies: perItem,
            selectionLevelBody: "",
            atMs: at,
          });
        }
        this.render();
      }
      return;
    }

    if (
      !this.session.instructionOpen &&
      this.hasSelections() &&
      !isHostNativeEditableSurface(event.target)
    ) {
      if (mod && (event.key === "Delete" || event.key === "Backspace")) {
        event.preventDefault();
        this.clearEntireSelection();
        return;
      }
      if (!mod && !event.shiftKey && (event.key === "Delete" || event.key === "Backspace")) {
        event.preventDefault();
        this.removeFocusedItemFromSelection();
        return;
      }
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.navigate("parent");
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.navigate("child");
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.navigate("previous");
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      this.navigate("next");
      return;
    }

    if (event.key === " " && !mod && !event.altKey) {
      event.preventDefault();
      this.dispatchSession({ type: "toggle_pause" });
      this.overlays.showHover(null, (id) => this.controller.hasSelection(id));
      this.render();
    }
  }

  private navigate(direction: "parent" | "child" | "previous" | "next"): void {
    const { selectedIds } = this.controller.snapshot();
    if (selectedIds.length !== 1) return;

    const current = byElementId(selectedIds[0]);
    if (!current) return;

    const next = this.findNavigationTarget(current, direction);
    if (!next) return;

    this.controller.remember();
    const nid = elementId(next);
    this.controller.selectOnly(nid);
    this.dispatchSession({ type: "focus_change", focusElementId: nid });
    this.render();
  }

  private findNavigationTarget(current: Element, direction: "parent" | "child" | "previous" | "next"): Element | null {
    if (direction === "parent") {
      let parent = current.parentElement;
      while (parent && parent !== document.body && parent !== document.documentElement) {
        if (!isEditorElement(parent) && isVisible(parent)) return parent;
        parent = parent.parentElement;
      }
      return null;
    }

    if (direction === "child") {
      return Array.from(current.children).find((child) => !isEditorElement(child) && isVisible(child) && isMeaningful(child)) ?? null;
    }

    const parent = current.parentElement;
    if (!parent) return null;

    const siblings = Array.from(parent.children).filter((child) => !isEditorElement(child) && isVisible(child) && isMeaningful(child));
    const index = siblings.indexOf(current);
    return siblings[index + (direction === "next" ? 1 : -1)] ?? null;
  }

  private async copySelectionPrompt(): Promise<void> {
    const state = this.controller.snapshot();
    const overall = this.session.drafts.selectionLevelBody.trim();
    const copied = await copyPrompt({
      selectedIds: state.selectedIds,
      annotations: this.mergeAnnotationsForPrompt(state),
      pagePath: location.pathname,
      contextReader: { read: buildElementContext },
      clipboard: this.clipboard,
      selectionLevelInstruction: overall.length > 0 ? overall : undefined,
    });

    if (copied) {
      this.panel?.setUserHasManualCopiedOnce(true);
      this.panel?.showCopyFeedback("已复制提示词");
    }
  }

  private render(): void {
    const state = this.controller.snapshot();
    const viz = this.overlayViz();
    this.overlays.render(state.selectedIds, (id) => this.itemHasInstruction(id), viz, this.editBadgeCallbacks());
    this.panel?.renderTags(
      state.selectedIds.map((id) => {
        const el = byElementId(id);
        return {
          id,
          label: el ? elementLabel(el) : id,
          hasAnnotation: this.itemHasInstruction(id),
        };
      }),
    );
    this.panel?.setSessionState(this.session);
    this.syncPauseScrim();
    this.syncInstructionDock();
  }

  private rectsForUnionIds(ids: readonly string[]): AxisRect[] {
    const rects: AxisRect[] = [];
    for (const id of ids) {
      const el = byElementId(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      rects.push({ minX: r.left, minY: r.top, maxX: r.right, maxY: r.bottom });
    }
    return rects;
  }

  private computeInstructionAnchorRect(
    snap: ReturnType<SelectionController["snapshot"]>,
  ): DOMRect | null {
    if (!this.session.instructionOpen || snap.selectedIds.length === 0) return null;
    if (this.session.activeLayer === "whole_set" && snap.selectedIds.length >= 2) {
      const u = unionBounds(this.rectsForUnionIds(snap.selectedIds));
      if (!u) return null;
      return new DOMRect(u.minX, u.minY, u.maxX - u.minX, u.maxY - u.minY);
    }
    const focus =
      this.session.focusElementId ?? snap.selectedIds[snap.selectedIds.length - 1] ?? null;
    const el = focus ? byElementId(focus) : null;
    return el?.getBoundingClientRect() ?? null;
  }

  private syncInstructionDock(): void {
    const snap = this.controller.snapshot();
    const open = this.session.instructionOpen && snap.selectedIds.length > 0 && !this.isPaused();
    const layer: InstructionCanvasDockLayer =
      this.session.activeLayer === "whole_set" ? "whole_set" : "per_item";
    const fid =
      this.session.focusElementId ?? (snap.selectedIds.length === 1 ? snap.selectedIds[0]! : null);
    const value =
      this.session.activeLayer === "whole_set"
        ? this.session.drafts.selectionLevelBody
        : fid != null
          ? (this.session.drafts.perItemBodies[fid] ?? "")
          : "";
    const subtitle = "";
    this.instructionDock.sync({
      open,
      paused: this.session.picking === "paused",
      layer,
      anchorRect: this.computeInstructionAnchorRect(snap),
      value,
      subtitle,
    });
  }

  /** D-19：暂停且已选时加整页弱遮罩（描边已为灰；遮罩不拦截扩展 UI） */
  private syncPauseScrim(): void {
    const show = this.session.picking === "paused" && this.session.selectionCount > 0;
    if (show) {
      if (!this.pauseScrim) {
        const el = document.createElement("div");
        el.className = `${NS}-pause-scrim`;
        el.setAttribute("aria-hidden", "true");
        document.body.appendChild(el);
        this.pauseScrim = el;
      }
    } else if (this.pauseScrim) {
      this.pauseScrim.remove();
      this.pauseScrim = null;
    }
  }

  private positionAllOverlays(): void {
    const state = this.controller.snapshot();
    this.overlays.positionAll(
      state.selectedIds,
      (id) => this.itemHasInstruction(id),
      this.overlayViz(),
      this.editBadgeCallbacks(),
    );
    this.syncInstructionDock();
  }

  private hasSelections(): boolean {
    return this.controller.snapshot().selectedIds.length > 0;
  }

  private cancelDrag(): void {
    this.dragState?.marquee?.remove();
    this.dragState = null;
  }
}
