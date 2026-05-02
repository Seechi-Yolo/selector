import { byElementId, elementLabel } from "../dom/page-elements";
import { NS } from "../dom/constants";
import type { WholeSetFlow } from "../../entities/selection-session/session-model";
import { unionBounds, type AxisRect } from "../../entities/selection-session/union-bounds";

export type SelectionOverlayViz = {
  paused: boolean;
  focusId: string | null;
  wholeSetFlow: WholeSetFlow;
  instructionOpen: boolean;
};

/** 页上选取框右下角「编辑说明」按钮 → 与主进程 `open_*_badge` 同义 */
export type SelectionEditBadgeCallbacks = {
  onPerItemBadge(elementId: string): void;
  onUnionWholeBadge(): void;
};

interface SelectionOverlay {
  box: HTMLDivElement;
  corners: HTMLDivElement[];
  label: HTMLDivElement;
  editBadge: HTMLButtonElement;
}

interface UnionOverlay {
  box: HTMLDivElement;
  editBadge: HTMLButtonElement;
}

export class SelectionOverlays {
  private hoverBox: HTMLDivElement | null = null;
  private overlays = new Map<string, SelectionOverlay>();
  private union: UnionOverlay | null = null;
  private latestEditActions: SelectionEditBadgeCallbacks | null = null;

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

  render(
    selectedIds: string[],
    hasAnnotation: (id: string) => boolean,
    viz: SelectionOverlayViz,
    edit: SelectionEditBadgeCallbacks,
  ): void {
    this.latestEditActions = edit;

    for (const id of [...this.overlays.keys()]) {
      if (!selectedIds.includes(id)) this.destroyOverlay(id);
    }

    if (selectedIds.length < 2) {
      this.destroyUnion();
    } else {
      this.ensureUnion();
    }

    for (const id of selectedIds) {
      if (!this.overlays.has(id)) this.createOverlay(id);
      this.positionOverlay(id, hasAnnotation(id), viz, selectedIds.length);
    }

    if (selectedIds.length >= 2) {
      this.positionUnion(selectedIds, viz);
    }
  }

  positionAll(
    selectedIds: string[],
    hasAnnotation: (id: string) => boolean,
    viz: SelectionOverlayViz,
    edit: SelectionEditBadgeCallbacks,
  ): void {
    this.latestEditActions = edit;
    for (const id of selectedIds) {
      this.positionOverlay(id, hasAnnotation(id), viz, selectedIds.length);
    }
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

    const editBadge = document.createElement("button");
    editBadge.type = "button";
    editBadge.className = `${NS}-root ${NS}-sel-edit-badge ${NS}-sel-edit-badge--union`;
    editBadge.textContent = "整段说明";
    editBadge.title = "打开对当前选取的说明（整段）";
    editBadge.setAttribute("aria-label", "打开对当前选取的说明（整段）");
    editBadge.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.latestEditActions?.onUnionWholeBadge();
    });
    editBadge.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    document.body.appendChild(box);
    document.body.appendChild(editBadge);
    this.union = { box, editBadge };
  }

  private destroyUnion(): void {
    if (!this.union) return;
    this.union.box.remove();
    this.union.editBadge.remove();
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

    const btn = this.union.editBadge;
    const showUnionBadge =
      !viz.paused && !viz.instructionOpen && viz.wholeSetFlow === "whole_required";
    btn.style.display = showUnionBadge ? "" : "none";
    if (showUnionBadge) {
      btn.style.top = `${u.maxY + pad + 6}px`;
      btn.style.left = "auto";
      btn.style.right = `${window.innerWidth - u.maxX - pad}px`;
    }
    btn.classList.toggle(`${NS}-sel-edit-badge--paused`, viz.paused);

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

    const editBadge = document.createElement("button");
    editBadge.type = "button";
    editBadge.className = `${NS}-root ${NS}-sel-edit-badge`;
    editBadge.textContent = "编辑说明";
    editBadge.title = "打开此项的修改说明";
    editBadge.setAttribute("aria-label", "打开此项的修改说明");
    editBadge.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.latestEditActions?.onPerItemBadge(id);
    });
    editBadge.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    document.body.appendChild(box);
    document.body.appendChild(label);
    document.body.appendChild(editBadge);
    this.overlays.set(id, { box, corners, label, editBadge });
  }

  private positionOverlay(
    id: string,
    hasAnnotation: boolean,
    viz: SelectionOverlayViz,
    totalSelected: number,
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

    const btn = overlay.editBadge;
    const showPerItemBadge =
      !viz.paused &&
      !viz.instructionOpen &&
      (totalSelected === 1 || (totalSelected >= 2 && viz.wholeSetFlow === "whole_done"));

    btn.style.display = showPerItemBadge ? "" : "none";
    if (showPerItemBadge) {
      btn.style.top = `${rect.bottom + pad + 6}px`;
      btn.style.left = "auto";
      btn.style.right = `${window.innerWidth - rect.right - pad}px`;
    }
    btn.classList.toggle(`${NS}-sel-edit-badge--paused`, viz.paused);
    btn.classList.toggle(`${NS}-sel-edit-badge--has-note`, hasAnnotation);

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
  }

  private destroyOverlay(id: string): void {
    const overlay = this.overlays.get(id);
    if (!overlay) return;

    overlay.box.remove();
    overlay.corners.forEach((corner) => corner.remove());
    overlay.label.remove();
    overlay.editBadge.remove();
    this.overlays.delete(id);
  }
}
