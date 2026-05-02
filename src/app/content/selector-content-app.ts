import { saveAnnotation, clearSelectionAnnotation } from "../../features/annotate-selection";
import { buildElementContext, copyPrompt } from "../../features/copy-prompt";
import { EditorPanel } from "../../features/editor-panel";
import { tryMountTutorialIntro, type EditorOnboarding } from "../../features/editor-onboarding";
import { SelectionController } from "../../features/select-elements";
import {
  FORMATION_QUIET_MS,
  applyRemoveClick,
  createSessionReduceSeed,
  initialRemoveArm,
  reduceSelectionSession,
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
  isMeaningful,
  isVisible,
  meaningfulElements,
  resolveTarget,
} from "../../shared/dom/page-elements";
import { EditorChromeTheme } from "../../shared/editor-chrome";
import { AnnotationPopover, SelectionOverlays } from "../../shared/ui";

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
  private readonly popover = new AnnotationPopover();
  private readonly overlays = new SelectionOverlays((id, button) => this.showAnnotation(id, button));
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
  private removeArm = initialRemoveArm();
  private shiftQuietTimer: number | null = null;
  private clipboardFlushTimer: number | null = null;

  constructor() {
    const seed = createSessionReduceSeed();
    this.session = seed.state;
    this.clipboardIntent = seed.clipboard;
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
      onRemove: (id) => this.handleRemoveClick(id),
      onClear: () => {
        this.controller.remember();
        this.controller.clear();
        this.removeArm = initialRemoveArm();
        this.clearShiftQuietTimer();
        this.dispatchSession({ type: "clear_selection", atMs: Date.now() });
        this.popover.remove();
        this.render();
      },
      onMinimizeChange: () => this.overlays.showHover(null, (id) => this.controller.hasSelection(id)),
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
    this.popover.remove();
    this.overlays.destroy();
    this.onboarding?.destroy();
    this.onboarding = null;
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

  private async flushClipboardDebounced(): Promise<void> {
    const snap = this.controller.snapshot();
    if (snap.selectedIds.length === 0) return;
    const overall = this.session.drafts.selectionLevelBody.trim();
    await copyPrompt({
      selectedIds: snap.selectedIds,
      annotations: snap.annotations,
      pagePath: location.pathname,
      contextReader: { read: buildElementContext },
      clipboard: this.clipboard,
      selectionLevelInstruction: overall.length > 0 ? overall : undefined,
    });
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

  private handleRemoveClick(id: ElementId): void {
    const now = Date.now();
    const out = applyRemoveClick(this.removeArm, id, now);
    this.removeArm = out.next;
    if (!out.executeRemove) {
      this.panel?.showCopyFeedback("再次点击以移除此项");
      return;
    }
    this.removeArm = initialRemoveArm();
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
    if (this.panel?.isMinimized || this.isPaused()) return;
    if (this.wasJustDragging) return;

    event.preventDefault();
    event.stopPropagation();
    this.popover.remove();
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
    if (
      isExtensionUiSurface(event.target) &&
      event.target instanceof HTMLElement &&
      ["INPUT", "TEXTAREA"].includes(event.target.tagName)
    ) {
      return;
    }

    const mod = event.metaKey || event.ctrlKey;

    if (event.key === "Escape") {
      if (this.popover.isOpen) this.popover.remove();
      else {
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
            this.popover.remove();
            this.removeArm = initialRemoveArm();
          }
        }
        this.render();
      }
      return;
    }

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
          const focus = snap.selectedIds[n - 1] ?? null;
          this.dispatchSession({ type: "immediate_select", count: n, focusElementId: focus, atMs: at });
        }
        this.render();
      }
      return;
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
      annotations: state.annotations,
      pagePath: location.pathname,
      contextReader: { read: buildElementContext },
      clipboard: this.clipboard,
      selectionLevelInstruction: overall.length > 0 ? overall : undefined,
    });

    if (copied) {
      this.panel?.setUserHasManualCopiedOnce(true);
      this.panel?.showCopyFeedback("已复制");
    }
  }

  private render(): void {
    const state = this.controller.snapshot();
    this.overlays.render(state.selectedIds, (id) => Boolean(state.annotations[id]));
    this.panel?.renderTags(
      state.selectedIds.map((id) => {
        const el = byElementId(id);
        return {
          id,
          label: el ? elementLabel(el) : id,
          hasAnnotation: Boolean(state.annotations[id]),
        };
      }),
    );
    this.panel?.setSessionState(this.session);
  }

  private positionAllOverlays(): void {
    const state = this.controller.snapshot();
    this.overlays.positionAll(state.selectedIds, (id) => Boolean(state.annotations[id]));
  }

  private hasSelections(): boolean {
    return this.controller.snapshot().selectedIds.length > 0;
  }

  private cancelDrag(): void {
    this.dragState?.marquee?.remove();
    this.dragState = null;
  }

  private showAnnotation(id: ElementId, button: HTMLButtonElement): void {
    this.popover.show({
      id,
      anchor: button,
      value: this.controller.getAnnotation(id),
      onSave: (value) => {
        saveAnnotation(this.controller, id, value);
        this.dispatchSession({
          type: "draft_set_text",
          scope: "per_item",
          elementId: id,
          text: value,
          atMs: Date.now(),
        });
        this.render();
      },
      onClear: () => {
        clearSelectionAnnotation(this.controller, id);
        this.dispatchSession({
          type: "draft_clear",
          scope: "per_item",
          elementId: id,
          atMs: Date.now(),
        });
        this.render();
      },
    });
  }
}
