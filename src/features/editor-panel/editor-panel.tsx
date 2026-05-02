import { createRoot, type Root } from "react-dom/client";
import type { SelectionSessionState } from "../../entities/selection-session";
import { initialSelectionSessionState } from "../../entities/selection-session";
import { SelectionSessionPanel } from "../selection-session-panel/ui/SelectionSessionPanel";
import { NS } from "../../shared/dom/constants";
import type { PanelTag } from "./panel-tag";

export interface EditorPanelOptions {
  mount?: HTMLElement;
  layout?: "floating" | "sandbox";
}

interface EditorPanelCallbacks {
  /** 保留给快捷键复制；面板无常驻复制按钮（D-07） */
  onCopy(): void;
  onClose(): void;
  onMinimizeChange(minimized: boolean): void;
  onTagFocusRequest(tagId: PanelTag["id"]): void;
}

export class EditorPanel {
  private readonly root: HTMLDivElement;
  private readonly mountPoint: HTMLDivElement;
  private readonly reactRoot: Root;
  private readonly callbacks: EditorPanelCallbacks;
  private readonly layout: NonNullable<EditorPanelOptions["layout"]>;

  private minimized = false;
  private sessionState: SelectionSessionState = initialSelectionSessionState();
  private tags: PanelTag[] = [];
  private toastMessage: string | null = null;
  private copyTimer: number | null = null;
  private dragBound = false;
  private userHasManualCopiedOnce = false;

  constructor(callbacks: EditorPanelCallbacks, options?: EditorPanelOptions) {
    this.callbacks = callbacks;
    this.layout = options?.layout ?? "floating";

    this.root = document.createElement("div");
    this.root.className = `${NS}-root ${NS}-chat`;
    if (this.layout === "sandbox") {
      this.root.classList.add(`${NS}-chat--sandbox`);
    }
    this.root.style.width = "auto";
    this.root.style.background = "transparent";
    this.root.style.border = "none";
    this.root.style.boxShadow = "none";
    this.root.style.overflow = "visible";

    this.mountPoint = document.createElement("div");
    this.root.appendChild(this.mountPoint);

    (options?.mount ?? document.body).appendChild(this.root);

    this.reactRoot = createRoot(this.mountPoint);
    this.commit();
  }

  get isMinimized(): boolean {
    return this.minimized;
  }

  get element(): HTMLDivElement {
    return this.root;
  }

  destroy(): void {
    if (this.copyTimer) window.clearTimeout(this.copyTimer);
    this.reactRoot.unmount();
    this.root.remove();
  }

  setSessionState(session: SelectionSessionState): void {
    this.sessionState = session;
    this.commit();
  }

  setUserHasManualCopiedOnce(value: boolean): void {
    this.userHasManualCopiedOnce = value;
    this.commit();
  }

  renderTags(tags: PanelTag[]): void {
    this.tags = tags;
    this.commit();
  }

  showCopyFeedback(message: string): void {
    if (this.copyTimer) window.clearTimeout(this.copyTimer);
    this.toastMessage = message;
    this.commit();
    this.copyTimer = window.setTimeout(() => {
      this.toastMessage = null;
      this.copyTimer = null;
      this.commit();
    }, 2000);
  }

  private toggleMinimize(): void {
    this.minimized = !this.minimized;
    this.syncOuterChrome();
    this.commit();
    this.applyMinimizedDockLayout();
    this.callbacks.onMinimizeChange(this.minimized);
  }

  /** 浮动布局：最小化时整壳磁吸到视口右侧竖条；展开恢复右下默认位 */
  private applyMinimizedDockLayout(): void {
    if (this.layout !== "floating") return;
    const dockRight = () => {
      this.root.style.setProperty("position", "fixed");
      this.root.style.setProperty("right", "6px");
      this.root.style.setProperty("left", "auto");
      this.root.style.setProperty("bottom", "auto");
      this.root.style.removeProperty("transform");
      this.root.style.setProperty("width", "auto");
    };
    if (this.minimized) {
      dockRight();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const h = this.root.getBoundingClientRect().height || 100;
          const y = Math.round((window.innerHeight - h) / 2);
          const clamped = Math.max(40, Math.min(y, window.innerHeight - h - 40));
          this.root.style.setProperty("top", `${clamped}px`);
        });
      });
    } else {
      this.root.style.removeProperty("transform");
      this.root.style.removeProperty("top");
      this.root.style.setProperty("position", "fixed");
      this.root.style.setProperty("right", "20px");
      this.root.style.setProperty("bottom", "20px");
      this.root.style.setProperty("left", "auto");
      this.root.style.removeProperty("width");
    }
  }

  private syncOuterChrome(): void {
    this.root.classList.toggle(`${NS}-minimized`, this.minimized);
  }

  private commit(): void {
    this.syncOuterChrome();
    this.reactRoot.render(
      <SelectionSessionPanel
        session={this.sessionState}
        tags={this.tags}
        minimized={this.minimized}
        layout={this.layout}
        toastMessage={this.toastMessage}
        userHasManualCopiedOnce={this.userHasManualCopiedOnce}
        onMinimize={() => this.toggleMinimize()}
        onClose={() => this.callbacks.onClose()}
        onTagFocusRequest={(id) => this.callbacks.onTagFocusRequest(id)}
      />,
    );
    requestAnimationFrame(() => this.ensureDragBinding());
  }

  private ensureDragBinding(): void {
    if (this.dragBound) return;
    const handle = this.root.querySelector<HTMLElement>("[data-sel-drag-handle]");
    if (!handle) return;
    this.dragBound = true;
    this.makeDraggable(this.root, handle);
  }

  private makeDraggable(panel: HTMLElement, handle: HTMLElement): void {
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    handle.addEventListener("mousedown", (event) => {
      if ((event.target as Element).closest(".sel-session-icon-btn")) return;
      event.preventDefault();

      const rect = panel.getBoundingClientRect();
      startX = event.clientX;
      startY = event.clientY;
      startLeft = rect.left;
      startTop = rect.top;

      const move = (moveEvent: MouseEvent) => {
        if (this.layout === "floating" && this.minimized) {
          panel.style.top = `${startTop + moveEvent.clientY - startY}px`;
          return;
        }
        panel.style.left = `${startLeft + moveEvent.clientX - startX}px`;
        panel.style.top = `${startTop + moveEvent.clientY - startY}px`;
        panel.style.right = "auto";
        panel.style.bottom = "auto";
        panel.style.removeProperty("transform");
      };
      const up = () => {
        if (this.layout === "floating" && this.minimized) {
          panel.style.setProperty("right", "6px");
          panel.style.setProperty("left", "auto");
        }
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
      };

      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    });
  }
}
