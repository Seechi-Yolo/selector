import { NS } from "../dom/constants";

export type InstructionCanvasDockLayer = "whole_set" | "per_item";

export interface InstructionCanvasDockCallbacks {
  onDraftChange(value: string): void;
  onEnterComplete(): void;
  onCtrlDeleteClear(): void;
}

/**
 * 画布选取框正下方的「修改说明 / 对当前选取的说明」输入层（PRD D-22、D-23）。
 * 根节点带 `.${NS}-root`，与主面板同属扩展 UI，避免页上点选误触。
 */
export class InstructionCanvasDock {
  private root: HTMLDivElement | null = null;
  private textarea: HTMLTextAreaElement | null = null;
  private subtitleEl: HTMLParagraphElement | null = null;
  private titleEl: HTMLDivElement | null = null;
  private lastLayer: InstructionCanvasDockLayer | null = null;

  constructor(private readonly callbacks: InstructionCanvasDockCallbacks) {}

  sync(params: {
    open: boolean;
    paused: boolean;
    layer: InstructionCanvasDockLayer;
    anchorRect: DOMRect | null;
    value: string;
    subtitle: string;
  }): void {
    if (!params.open || params.paused || !params.anchorRect) {
      this.teardown();
      return;
    }

    this.ensureDom();
    const r = params.anchorRect;
    const maxW = Math.min(440, window.innerWidth - 16, Math.max(200, r.width + 48));
    let left = r.left + (r.width - maxW) / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - maxW - 8));
    const top = r.bottom + 8;

    this.root!.style.left = `${left}px`;
    this.root!.style.top = `${top}px`;
    this.root!.style.width = `${maxW}px`;

    this.titleEl!.textContent = params.layer === "whole_set" ? "对当前选取的说明" : "修改说明";
    this.subtitleEl!.textContent = params.subtitle;

    const layerChanged = this.lastLayer !== params.layer;
    this.lastLayer = params.layer;
    if (layerChanged || document.activeElement !== this.textarea) {
      this.textarea!.value = params.value;
    }
    this.textarea!.placeholder =
      params.layer === "whole_set" ? "输入对当前选取的说明…" : "输入修改说明…";
    if (layerChanged) {
      this.textarea!.focus();
    }
  }

  destroy(): void {
    this.teardown();
  }

  private ensureDom(): void {
    if (this.root) return;

    const root = document.createElement("div");
    root.className = `${NS}-root ${NS}-instruction-dock`;

    const title = document.createElement("div");
    title.className = `${NS}-instruction-dock-title`;

    const sub = document.createElement("p");
    sub.className = `${NS}-instruction-dock-sub`;

    const ta = document.createElement("textarea");
    ta.className = `${NS}-instruction-dock-input`;
    ta.rows = 3;
    ta.setAttribute(
      "aria-label",
      "说明正文：对当前选取的说明或逐项修改说明，详见操作引导中的快捷键说明。",
    );

    ta.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.callbacks.onEnterComplete();
        return;
      }
      const mod = event.ctrlKey || event.metaKey;
      if (mod && (event.key === "Delete" || event.key === "Backspace")) {
        event.preventDefault();
        this.callbacks.onCtrlDeleteClear();
        return;
      }
      event.stopPropagation();
    });
    ta.addEventListener("click", (event) => event.stopPropagation());
    ta.addEventListener("input", () => {
      this.callbacks.onDraftChange(ta.value);
    });

    root.appendChild(title);
    root.appendChild(sub);
    root.appendChild(ta);
    document.body.appendChild(root);

    this.root = root;
    this.titleEl = title;
    this.subtitleEl = sub;
    this.textarea = ta;
    ta.focus();
  }

  private teardown(): void {
    this.root?.remove();
    this.root = null;
    this.textarea = null;
    this.titleEl = null;
    this.subtitleEl = null;
    this.lastLayer = null;
  }
}
