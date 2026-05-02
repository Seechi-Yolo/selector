import { byElementId, elementLabel } from "../dom/page-elements";
import { NS } from "../dom/constants";
import type { WholeSetFlow } from "../../entities/selection-session/session-model";
import { unionBounds, type AxisRect } from "../../entities/selection-session/union-bounds";

export type SelectionOverlayViz = {
  paused: boolean;
  focusId: string | null;
  wholeSetFlow: WholeSetFlow;
};

export type InstructionEditRequest =
  | { kind: "per_item"; id: string; anchor: HTMLButtonElement }
  | { kind: "whole_union"; anchor: HTMLButtonElement };

interface SelectionOverlay {
  box: HTMLDivElement;
  corners: HTMLDivElement[];
  label: HTMLDivElement;
  editButton: HTMLButtonElement;
}

interface UnionOverlay {
  box: HTMLDivElement;
  editButton: HTMLButtonElement;
}

export class SelectionOverlays {
  private hoverBox: HTMLDivElement | null = null;
  private overlays = new Map<string, SelectionOverlay>();
  private union: UnionOverlay | null = null;

  constructor(private readonly onEditInstruction: (req: InstructionEditRequest) => void) {}

  createHoverBox(): void {
    this.hoverBox = document.createElement("div");
    this.hoverBox.className = `${NS}-hover-box`;
    document.body.appendChild(this.hoverBox);
  }

  showHover(el: Element | null, isSelected: (id: string) => boolean): void {
    if (!this.hoverBox) return;
    if (!el) {
      this.hoverBox.style.opacity = "0";
      return;
    }

    const id = el.getAttribute("data-ai-id");
    if (id && isSelected(id)) {
      this.hoverBox.style.opacity = "0";
      return;
    }

    const rect = el.getBoundingClientRect();
    this.hoverBox.style.top = `${rect.top - 1}px`;
    this.hoverBox.style.left = `${rect.left - 1}px`;
    this.hoverBox.style.width = `${rect.width + 2}px`;
    this.hoverBox.style.height = `${rect.height + 2}px`;
    this.hoverBox.style.opacity = "1";
  }

  render(selectedIds: string[], hasAnnotation: (id: string) => boolean, viz: SelectionOverlayViz): void {
    for (const id of [...this.overlays.keys()]) {
      if (!selectedIds.includes(id)) this.destroyOverlay(id);
    }

    if (selectedIds.length < 2) {
      this.destroyUnion();
    } else {
      this.ensureUnion();
    }

    const perItemEditBlocked = selectedIds.length >= 2 && viz.wholeSetFlow !== "whole_done";

    for (const id of selectedIds) {
      if (!this.overlays.has(id)) this.createOverlay(id);
      this.positionOverlay(id, hasAnnotation(id), viz, perItemEditBlocked);
    }

    if (selectedIds.length >= 2) {
      this.positionUnion(selectedIds, viz);
    }
  }

  positionAll(selectedIds: string[], hasAnnotation: (id: string) => boolean, viz: SelectionOverlayViz): void {
    const perItemEditBlocked = selectedIds.length >= 2 && viz.wholeSetFlow !== "whole_done";
    for (const id of selectedIds) this.positionOverlay(id, hasAnnotation(id), viz, perItemEditBlocked);
    if (selectedIds.length >= 2) this.positionUnion(selectedIds, viz);
  }

  destroy(): void {
    for (const id of [...this.overlays.keys()]) this.destroyOverlay(id);
    this.destroyUnion();
    this.hoverBox?.remove();
    this.hoverBox = null;
  }

  private ensureUnion(): void {
    if (this.union) return;
    const box = document.createElement("div");
    box.className = `${NS}-sel-box ${NS}-sel-box--union`;
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = `${NS}-root ${NS}-edit-instruction-btn ${NS}-edit-instruction-btn--union`;
    editButton.textContent = "编辑说明";
    editButton.title = "编辑说明：对当前选取的说明";
    editButton.setAttribute("aria-label", "编辑说明：对当前选取的说明");
    editButton.addEventListener("click", (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (editButton.disabled) return;
      this.onEditInstruction({ kind: "whole_union", anchor: editButton });
    });
    document.body.appendChild(box);
    document.body.appendChild(editButton);
    this.union = { box, editButton };
  }

  private destroyUnion(): void {
    if (!this.union) return;
    this.union.box.remove();
    this.union.editButton.remove();
    this.union = null;
  }

  private rectsForUnion(selectedIds: string[]): AxisRect[] {
    const rects: AxisRect[] = [];
    for (const id of selectedIds) {
      const el = byElementId(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      rects.push({ minX: r.left, minY: r.top, maxX: r.right, maxY: r.bottom });
    }
    return rects;
  }

  private positionUnion(selectedIds: string[], viz: SelectionOverlayViz): void {
    if (!this.union) return;
    const u = unionBounds(this.rectsForUnion(selectedIds));
    if (!u) return;

    const pad = 2;
    this.union.box.style.top = `${u.minY - pad}px`;
    this.union.box.style.left = `${u.minX - pad}px`;
    this.union.box.style.width = `${u.maxX - u.minX + pad * 2}px`;
    this.union.box.style.height = `${u.maxY - u.minY + pad * 2}px`;

    const btn = this.union.editButton;
    btn.style.top = `${u.minY - pad - 2}px`;
    btn.style.left = `${u.maxX + pad - 72}px`;
    btn.disabled = viz.paused;
    btn.classList.toggle(`${NS}-edit-instruction-btn--paused`, viz.paused);

    const pausedClass = `${NS}-sel-box--paused`;
    this.union.box.classList.toggle(pausedClass, viz.paused);
    this.union.box.classList.toggle(`${NS}-sel-box--active`, !viz.paused);
  }

  private createOverlay(id: string): void {
    const el = byElementId(id);
    if (!el) return;

    const box = document.createElement("div");
    box.className = `${NS}-sel-box ${NS}-sel-box--element`;

    const corners = [0, 1, 2, 3].map((index) => {
      const corner = document.createElement("div");
      corner.className = `${NS}-sel-corner`;
      corner.style.animationDelay = `${index * 28}ms`;
      document.body.appendChild(corner);
      return corner;
    });

    const label = document.createElement("div");
    label.className = `${NS}-sel-label`;
    label.textContent = elementLabel(el);

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = `${NS}-root ${NS}-edit-instruction-btn`;
    editButton.textContent = "编辑说明";
    editButton.title = "编辑说明：修改说明";
    editButton.setAttribute("aria-label", "编辑说明：修改说明");
    editButton.addEventListener("click", (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (editButton.disabled) return;
      this.onEditInstruction({ kind: "per_item", id, anchor: editButton });
    });

    document.body.appendChild(box);
    document.body.appendChild(label);
    document.body.appendChild(editButton);
    this.overlays.set(id, { box, corners, label, editButton });
  }

  private positionOverlay(
    id: string,
    hasAnnotation: boolean,
    viz: SelectionOverlayViz,
    perItemEditBlocked: boolean,
  ): void {
    const el = byElementId(id);
    const overlay = this.overlays.get(id);
    if (!el || !overlay) return;

    const rect = el.getBoundingClientRect();
    const pad = 2;
    const cornerSize = 6;
    const isFocus = viz.focusId != null && viz.focusId === id;

    overlay.box.style.top = `${rect.top - pad}px`;
    overlay.box.style.left = `${rect.left - pad}px`;
    overlay.box.style.width = `${rect.width + pad * 2}px`;
    overlay.box.style.height = `${rect.height + pad * 2}px`;

    const positions = [
      { top: rect.top - pad - cornerSize / 2, left: rect.left - pad - cornerSize / 2 },
      { top: rect.top - pad - cornerSize / 2, left: rect.right + pad - cornerSize / 2 },
      { top: rect.bottom + pad - cornerSize / 2, left: rect.left - pad - cornerSize / 2 },
      { top: rect.bottom + pad - cornerSize / 2, left: rect.right + pad - cornerSize / 2 },
    ];

    overlay.corners.forEach((corner, index) => {
      corner.style.top = `${positions[index].top}px`;
      corner.style.left = `${positions[index].left}px`;
    });

    overlay.label.style.top = `${rect.top - pad - 20}px`;
    overlay.label.style.left = `${rect.left - pad}px`;
    overlay.editButton.style.top = `${rect.top - pad - 24}px`;
    overlay.editButton.style.left = `${rect.right + pad + 4}px`;

    const pausedClass = `${NS}-sel-box--paused`;
    const focusClass = `${NS}-sel-box--focus`;
    overlay.box.classList.toggle(pausedClass, viz.paused);
    overlay.box.classList.toggle(`${NS}-sel-box--active`, !viz.paused);
    overlay.box.classList.toggle(focusClass, isFocus && !viz.paused);

    overlay.corners.forEach((c) => {
      c.classList.toggle(`${NS}-sel-corner--paused`, viz.paused);
      c.classList.toggle(`${NS}-sel-corner--active`, !viz.paused);
      c.classList.toggle(`${NS}-sel-corner--focus`, isFocus && !viz.paused);
    });

    overlay.label.classList.toggle(`${NS}-sel-label--paused`, viz.paused);
    overlay.editButton.classList.toggle(`${NS}-edit-instruction-btn--paused`, viz.paused);
    overlay.editButton.classList.toggle(`${NS}-edit-instruction-btn--blocked`, perItemEditBlocked);
    overlay.editButton.disabled = viz.paused || perItemEditBlocked;
    if (perItemEditBlocked) {
      editButtonTitle(overlay.editButton, "请先完成「对当前选取的说明」后再编辑逐项修改说明");
    } else {
      editButtonTitle(overlay.editButton, "编辑说明：修改说明");
    }

    overlay.editButton.classList.toggle(`${NS}-edit-instruction-btn--has-note`, hasAnnotation);
  }

  private destroyOverlay(id: string): void {
    const overlay = this.overlays.get(id);
    if (!overlay) return;

    overlay.box.remove();
    overlay.corners.forEach((corner) => corner.remove());
    overlay.label.remove();
    overlay.editButton.remove();
    this.overlays.delete(id);
  }
}

function editButtonTitle(btn: HTMLButtonElement, title: string): void {
  btn.title = title;
  btn.setAttribute("aria-label", title);
}
