import type { ElementId } from "../../entities/element-selection";
import { NS } from "../dom/constants";

export interface PanelTag {
  id: ElementId;
  label: string;
  hasAnnotation: boolean;
}

interface EditorPanelCallbacks {
  onCopy(): void;
  onClose(): void;
  onRemove(id: ElementId): void;
  onClear(): void;
  onMinimizeChange(minimized: boolean): void;
}

const ICON_MINIMIZE =
  '<svg width="10" height="2" viewBox="0 0 10 2" fill="none"><line x1="0" y1="1" x2="10" y2="1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const ICON_EXPAND =
  '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 7L5 3L9 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export class EditorPanel {
  private root: HTMLDivElement;
  private minimized = false;
  private copyTimer: number | null = null;

  constructor(private readonly callbacks: EditorPanelCallbacks) {
    this.root = document.createElement("div");
    this.root.className = `${NS}-root ${NS}-chat`;
    this.root.innerHTML = `
      <div class="${NS}-drag-handle">
        <span class="${NS}-drag-title">
          <span class="${NS}-status-dot"></span>
          <span class="${NS}-status-label">Selecting</span>
        </span>
        <div class="${NS}-panel-actions">
          <button class="${NS}-panel-btn" data-action="minimize" title="Minimize">${ICON_MINIMIZE}</button>
          <button class="${NS}-panel-btn" data-action="close" title="Close">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="${NS}-panel-body">
        <div class="${NS}-chat-tags ${NS}-hidden"></div>
        <div class="${NS}-shortcuts">
          <span><kbd>Click</kbd> Select</span>
          <span><kbd>Shift</kbd> Multi</span>
          <span><kbd>Arrows</kbd> Navigate</span>
          <span><kbd>Space</kbd> Pause</span>
          <span><kbd>Cmd/Ctrl C</kbd> Copy</span>
          <span><kbd>Cmd/Ctrl Z</kbd> Undo</span>
          <span><kbd>Esc</kbd> Clear</span>
        </div>
        <button class="${NS}-copy-btn" disabled>Copy Prompt</button>
      </div>
    `;
    document.body.appendChild(this.root);

    this.copyButton.onclick = () => this.callbacks.onCopy();
    this.root.querySelector<HTMLButtonElement>('[data-action="minimize"]')!.onclick = () => this.toggleMinimize();
    this.root.querySelector<HTMLButtonElement>('[data-action="close"]')!.onclick = () => this.callbacks.onClose();
    this.makeDraggable(this.root, this.root.querySelector<HTMLElement>(`.${NS}-drag-handle`)!);
  }

  get isMinimized(): boolean {
    return this.minimized;
  }

  /** Host element for layout anchoring (e.g. onboarding card above the panel). */
  get element(): HTMLDivElement {
    return this.root;
  }

  destroy(): void {
    if (this.copyTimer) window.clearTimeout(this.copyTimer);
    this.root.remove();
  }

  setPaused(paused: boolean): void {
    const dot = this.root.querySelector<HTMLElement>(`.${NS}-status-dot`);
    const label = this.root.querySelector<HTMLElement>(`.${NS}-status-label`);
    if (dot) dot.style.background = paused ? "#888" : "#4ade80";
    if (label) label.textContent = paused ? "Paused" : "Selecting";
  }

  renderTags(tags: PanelTag[]): void {
    const container = this.root.querySelector<HTMLElement>(`.${NS}-chat-tags`)!;
    container.innerHTML = "";

    if (tags.length === 0) {
      container.classList.add(`${NS}-hidden`);
      this.copyButton.disabled = true;
      return;
    }

    container.classList.remove(`${NS}-hidden`);
    this.copyButton.disabled = false;

    tags.forEach((tag, index) => {
      const item = document.createElement("span");
      item.className = `${NS}-tag`;
      item.innerHTML = `<span class="${NS}-tag-num">${index + 1}</span><span class="${NS}-tag-label">${tag.label}${tag.hasAnnotation ? " *" : ""}</span><button class="${NS}-tag-x" title="Remove">x</button>`;
      item.querySelector("button")!.addEventListener(
        "click",
        (event) => {
          event.stopPropagation();
          this.callbacks.onRemove(tag.id);
        },
        true,
      );
      container.appendChild(item);
    });

    const clearAllButton = document.createElement("button");
    clearAllButton.className = `${NS}-tags-action`;
    clearAllButton.title = "Clear all";
    clearAllButton.textContent = "Clear";
    clearAllButton.onclick = (event) => {
      event.stopPropagation();
      this.callbacks.onClear();
    };
    container.appendChild(clearAllButton);
  }

  showCopyFeedback(message: string): void {
    if (this.copyTimer) window.clearTimeout(this.copyTimer);
    this.copyButton.classList.add(`${NS}-copy-done`);
    this.copyButton.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> ${message}`;
    this.copyTimer = window.setTimeout(() => {
      this.copyButton.classList.remove(`${NS}-copy-done`);
      this.copyButton.textContent = "Copy Prompt";
      this.copyTimer = null;
    }, 2000);
  }

  private get copyButton(): HTMLButtonElement {
    return this.root.querySelector<HTMLButtonElement>(`.${NS}-copy-btn`)!;
  }

  private toggleMinimize(): void {
    this.minimized = !this.minimized;
    const body = this.root.querySelector<HTMLElement>(`.${NS}-panel-body`)!;
    const button = this.root.querySelector<HTMLButtonElement>('[data-action="minimize"]')!;

    if (this.minimized) {
      body.style.display = "none";
      this.root.classList.add(`${NS}-minimized`);
      button.innerHTML = ICON_EXPAND;
      button.title = "Restore";
    } else {
      body.style.display = "";
      this.root.classList.remove(`${NS}-minimized`);
      button.innerHTML = ICON_MINIMIZE;
      button.title = "Minimize";
    }

    this.callbacks.onMinimizeChange(this.minimized);
  }

  private makeDraggable(panel: HTMLElement, handle: HTMLElement): void {
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    handle.addEventListener("mousedown", (event) => {
      if ((event.target as Element).closest(`.${NS}-panel-btn`)) return;
      event.preventDefault();

      const rect = panel.getBoundingClientRect();
      startX = event.clientX;
      startY = event.clientY;
      startLeft = rect.left;
      startTop = rect.top;

      const move = (moveEvent: MouseEvent) => {
        panel.style.left = `${startLeft + moveEvent.clientX - startX}px`;
        panel.style.top = `${startTop + moveEvent.clientY - startY}px`;
        panel.style.right = "auto";
        panel.style.bottom = "auto";
      };
      const up = () => {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
      };

      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    });
  }
}
