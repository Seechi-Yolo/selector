import { NS } from "../dom/constants";

/** 左右与顶部贴边留白 */
const EDGE_MARGIN = 10;
/** 底部留白：兼顾不被裁切与尽量贴近可视区域底边 */
const BOTTOM_MARGIN =10;
const DOCK_GAP = 8;
const DOCK_MIN_HEIGHT = 96;

function layoutViewportHeightPx(): number {
  const vv = window.visualViewport;
  if (vv && vv.height > 0) {
    return vv.height;
  }
  return window.innerHeight;
}

/** 根据当前盒高整体上移并收紧 maxHeight，使底边落在可视高度内 */
function verticalClampDock(root: HTMLElement, vh: number): void {
  const br = root.getBoundingClientRect();
  let t = br.top;
  const h = br.height;
  if (br.bottom > vh - BOTTOM_MARGIN) {
    t -= br.bottom - (vh - BOTTOM_MARGIN);
  }
  if (t < EDGE_MARGIN) {
    t = EDGE_MARGIN;
  }
  if (t + h > vh - BOTTOM_MARGIN) {
    t = Math.max(EDGE_MARGIN, vh - BOTTOM_MARGIN - h);
  }
  root.style.top = `${t}px`;
  root.style.maxHeight = `${Math.max(DOCK_MIN_HEIGHT, vh - t - BOTTOM_MARGIN)}px`;
}

/** 将说明层限制在视口内：先锚在选取框下沿，再整体上移 / 限制 maxHeight；与选取框重叠时翻到选取框上方；二次测量避免 maxHeight 生效前算错高度 */
function layoutInstructionDockInViewport(root: HTMLElement, anchor: DOMRect): void {
  const vh = layoutViewportHeightPx();
  const vw = window.innerWidth;
  const maxW = Math.min(440, vw - 16, Math.max(200, anchor.width + 48));
  let left = anchor.left + (anchor.width - maxW) / 2;
  left = Math.max(EDGE_MARGIN, Math.min(left, vw - maxW - EDGE_MARGIN));

  const spaceBelow = vh - anchor.bottom - DOCK_GAP - BOTTOM_MARGIN;
  const spaceAbove = anchor.top - DOCK_GAP - EDGE_MARGIN;
  let top: number;
  let maxH: number;
  if (spaceBelow < 100 && spaceAbove > spaceBelow + 24) {
    const targetBlock = Math.min(280, Math.max(DOCK_MIN_HEIGHT, spaceAbove));
    top = anchor.top - DOCK_GAP - targetBlock;
    if (top < EDGE_MARGIN) {
      top = EDGE_MARGIN;
    }
    maxH = Math.max(DOCK_MIN_HEIGHT, anchor.top - DOCK_GAP - top);
    maxH = Math.min(maxH, vh - top - BOTTOM_MARGIN);
  } else {
    top = anchor.bottom + DOCK_GAP;
    maxH = Math.max(DOCK_MIN_HEIGHT, vh - top - BOTTOM_MARGIN);
  }

  root.style.left = `${left}px`;
  root.style.top = `${top}px`;
  root.style.width = `${maxW}px`;
  root.style.maxHeight = `${maxH}px`;
  root.style.overflowY = "auto";
  root.style.bottom = "auto";

  requestAnimationFrame(() => {
    verticalClampDock(root, vh);
    const br2 = root.getBoundingClientRect();
    const overlaps = br2.top < anchor.bottom - 4 && br2.bottom > anchor.top + 4;
    if (overlaps && anchor.top > EDGE_MARGIN + 80) {
      const h2 = br2.height;
      const tAbove = Math.max(EDGE_MARGIN, anchor.top - DOCK_GAP - h2);
      root.style.top = `${tAbove}px`;
      root.style.maxHeight = `${Math.max(DOCK_MIN_HEIGHT, anchor.top - DOCK_GAP - tAbove)}px`;
    }
    const vh2 = layoutViewportHeightPx();
    requestAnimationFrame(() => {
      verticalClampDock(root, vh2);
    });
  });
}

export type InstructionCanvasDockLayer = "whole_set" | "per_item";

export interface InstructionCanvasDockCallbacks {
  onDraftChange(value: string): void;
  onEnterComplete(): void;
  onCtrlDeleteClear(): void;
}

/**
 * 画布选取框正下方的「修改说明 / 对当前选取的说明」输入层（PRD I-22、I-23）。
 * 默认不自动展示；宿主在页面上 **Enter** 或选取框右下角 **编辑说明** 打开后再显示。Enter 提交、换行等提示放在输入区内侧。
 */
export class InstructionCanvasDock {
  private root: HTMLDivElement | null = null;
  private textarea: HTMLTextAreaElement | null = null;
  private subtitleEl: HTMLParagraphElement | null = null;
  private titleEl: HTMLDivElement | null = null;
  private inputHintEl: HTMLDivElement | null = null;
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
    layoutInstructionDockInViewport(this.root!, r);

    this.titleEl!.textContent = params.layer === "whole_set" ? "对当前选取的说明" : "修改说明";

    const sub = params.subtitle.trim();
    if (sub) {
      this.subtitleEl!.textContent = sub;
      this.subtitleEl!.style.display = "";
    } else {
      this.subtitleEl!.textContent = "";
      this.subtitleEl!.style.display = "none";
    }

    const layerChanged = this.lastLayer !== params.layer;
    this.lastLayer = params.layer;
    if (layerChanged || document.activeElement !== this.textarea) {
      this.textarea!.value = params.value;
    }
    this.textarea!.placeholder = params.layer === "whole_set" ? "整段说明…" : "本项说明…";
    this.textarea!.setAttribute(
      "aria-label",
      params.layer === "whole_set" ? "对当前选取的说明" : "修改说明",
    );
    if (this.inputHintEl) {
      this.inputHintEl.textContent = "Enter 提交 · Shift+Enter 换行";
    }
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

    const fieldWrap = document.createElement("div");
    fieldWrap.className = `${NS}-instruction-dock-field`;

    const ta = document.createElement("textarea");
    ta.className = `${NS}-instruction-dock-input`;
    ta.rows = 3;

    const inputHint = document.createElement("div");
    inputHint.className = `${NS}-instruction-dock-input-hint`;
    inputHint.textContent = "Enter 提交 · Shift+Enter 换行";

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

    fieldWrap.appendChild(ta);
    fieldWrap.appendChild(inputHint);
    root.appendChild(title);
    root.appendChild(sub);
    root.appendChild(fieldWrap);
    document.body.appendChild(root);

    this.root = root;
    this.titleEl = title;
    this.subtitleEl = sub;
    this.textarea = ta;
    this.inputHintEl = inputHint;
    ta.focus();
  }

  private teardown(): void {
    if (this.root) {
      this.root.style.maxHeight = "";
      this.root.style.overflowY = "";
    }
    this.root?.remove();
    this.root = null;
    this.textarea = null;
    this.titleEl = null;
    this.subtitleEl = null;
    this.inputHintEl = null;
    this.lastLayer = null;
  }
}
