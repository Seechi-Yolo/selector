import { saveAnnotation, clearSelectionAnnotation } from "../../features/annotate-selection";
import { copyPrompt } from "../../features/copy-prompt";
import { EditorOnboarding, isFirstThreeOnboardingDone } from "../../features/editor-onboarding";
import { SelectionController } from "../../features/select-elements";
import { BrowserClipboard } from "../../shared/clipboard";
import type { ElementId } from "../../entities/element-selection";
import { rectsIntersect } from "../../shared/dom/geometry";
import {
  assignElementIds,
  buildElementContext,
  byElementId,
  elementId,
  elementLabel,
  isEditorElement,
  isMeaningful,
  isVisible,
  meaningfulElements,
  resolveTarget,
} from "../../shared/dom/page-elements";
import { injectEditorStyle, removeEditorStyle } from "../../shared/styles/inject-editor-style";
import { AnnotationPopover, EditorPanel, SelectionOverlays } from "../../shared/ui";

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
  private paused = false;
  private started = false;

  init(): void {
    if (this.started) return;
    this.started = true;

    injectEditorStyle();
    assignElementIds(document.body);
    this.overlays.createHoverBox();
    this.panel = new EditorPanel({
      onCopy: () => void this.copySelectionPrompt(),
      onClose: () => this.destroy(),
      onRemove: (id) => {
        this.controller.remove(id);
        this.render();
      },
      onClear: () => {
        this.controller.remember();
        this.controller.clear();
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

    if (!isFirstThreeOnboardingDone()) {
      this.mountOnboarding();
    }
  }

  private mountOnboarding(): void {
    this.onboarding?.destroy();
    this.onboarding = null;
    this.onboarding = new EditorOnboarding(
      () => this.panel?.element ?? null,
      () => {
        this.onboarding = null;
      },
    );
    this.onboarding.mount();
  }

  destroy(): void {
    for (const { target, type, listener, options } of this.listeners) {
      target.removeEventListener(type, listener, options);
    }
    this.listeners.length = 0;
    this.cancelDrag();
    this.popover.remove();
    this.overlays.destroy();
    this.onboarding?.destroy();
    this.onboarding = null;
    this.panel?.destroy();
    this.panel = null;
    removeEditorStyle();
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

  private handleMouseMove(event: MouseEvent): void {
    if (this.panel?.isMinimized || this.paused) return;

    if (this.dragState) {
      const dx = event.clientX - this.dragState.startX;
      const dy = event.clientY - this.dragState.startY;

      if (!this.dragState.isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        this.dragState.isDragging = true;
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
    if (isEditorElement(event.target)) return;
    if (this.panel?.isMinimized || this.paused) return;
    if (event.button !== 0) return;
    if (event.shiftKey) event.preventDefault();

    this.dragState = {
      startX: event.clientX,
      startY: event.clientY,
      isDragging: false,
      marquee: null,
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

    this.render();
    window.setTimeout(() => {
      this.wasJustDragging = false;
    }, 0);
  }

  private handleClick(event: MouseEvent): void {
    if (isEditorElement(event.target)) return;
    if (this.panel?.isMinimized || this.paused) return;
    if (this.wasJustDragging) return;

    event.preventDefault();
    event.stopPropagation();
    this.popover.remove();
    window.getSelection()?.removeAllRanges();

    const target = resolveTarget(event.target);
    if (!target) return;

    this.controller.remember();
    const id = elementId(target);
    if (event.shiftKey) this.controller.toggle(id);
    else this.controller.selectOnly(id);

    this.render();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (
      isEditorElement(event.target) &&
      event.target instanceof HTMLElement &&
      ["INPUT", "TEXTAREA"].includes(event.target.tagName)
    ) {
      return;
    }

    const mod = event.metaKey || event.ctrlKey;

    if (event.key === "Escape") {
      if (this.popover.isOpen) this.popover.remove();
      else {
        this.controller.remember();
        this.controller.clear();
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
      if (this.controller.undo()) this.render();
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
      this.togglePaused();
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
    this.controller.selectOnly(elementId(next));
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

  private togglePaused(): void {
    this.paused = !this.paused;
    this.overlays.showHover(null, (id) => this.controller.hasSelection(id));
    this.panel?.setPaused(this.paused);
  }

  private showAnnotation(id: ElementId, button: HTMLButtonElement): void {
    this.popover.show({
      id,
      anchor: button,
      value: this.controller.getAnnotation(id),
      onSave: (value) => {
        saveAnnotation(this.controller, id, value);
        this.render();
      },
      onClear: () => {
        clearSelectionAnnotation(this.controller, id);
        this.render();
      },
    });
  }

  private async copySelectionPrompt(): Promise<void> {
    const state = this.controller.snapshot();
    const copied = await copyPrompt({
      selectedIds: state.selectedIds,
      annotations: state.annotations,
      pagePath: location.pathname,
      contextReader: { read: buildElementContext },
      clipboard: this.clipboard,
    });

    if (copied) this.panel?.showCopyFeedback("Copied");
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
}
