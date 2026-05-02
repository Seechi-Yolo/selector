import { byElementId, elementLabel } from "../dom/page-elements";
import { NS } from "../dom/constants";

interface SelectionOverlay {
  box: HTMLDivElement;
  corners: HTMLDivElement[];
  label: HTMLDivElement;
  annotateButton: HTMLButtonElement;
}

export class SelectionOverlays {
  private hoverBox: HTMLDivElement | null = null;
  private overlays = new Map<string, SelectionOverlay>();

  constructor(private readonly onAnnotate: (id: string, button: HTMLButtonElement) => void) {}

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

  render(selectedIds: string[], hasAnnotation: (id: string) => boolean): void {
    for (const id of [...this.overlays.keys()]) {
      if (!selectedIds.includes(id)) this.destroyOverlay(id);
    }

    for (const id of selectedIds) {
      if (!this.overlays.has(id)) this.createOverlay(id);
      this.positionOverlay(id, hasAnnotation(id));
    }
  }

  positionAll(selectedIds: string[], hasAnnotation: (id: string) => boolean): void {
    for (const id of selectedIds) this.positionOverlay(id, hasAnnotation(id));
  }

  destroy(): void {
    for (const id of [...this.overlays.keys()]) this.destroyOverlay(id);
    this.hoverBox?.remove();
    this.hoverBox = null;
  }

  private createOverlay(id: string): void {
    const el = byElementId(id);
    if (!el) return;

    const box = document.createElement("div");
    box.className = `${NS}-sel-box`;

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

    const annotateButton = document.createElement("button");
    annotateButton.className = `${NS}-root ${NS}-annotate-btn`;
    annotateButton.title = "Add instruction";
    annotateButton.innerHTML =
      '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
    annotateButton.addEventListener("click", (event) => {
      event.stopPropagation();
      event.preventDefault();
      this.onAnnotate(id, annotateButton);
    });

    document.body.appendChild(box);
    document.body.appendChild(label);
    document.body.appendChild(annotateButton);
    this.overlays.set(id, { box, corners, label, annotateButton });
  }

  private positionOverlay(id: string, hasAnnotation: boolean): void {
    const el = byElementId(id);
    const overlay = this.overlays.get(id);
    if (!el || !overlay) return;

    const rect = el.getBoundingClientRect();
    const pad = 2;
    const cornerSize = 6;

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
    overlay.annotateButton.style.top = `${rect.top - pad - 22}px`;
    overlay.annotateButton.style.left = `${rect.right + pad + 4}px`;
    overlay.annotateButton.classList.toggle(`${NS}-has-note`, hasAnnotation);
  }

  private destroyOverlay(id: string): void {
    const overlay = this.overlays.get(id);
    if (!overlay) return;

    overlay.box.remove();
    overlay.corners.forEach((corner) => corner.remove());
    overlay.label.remove();
    overlay.annotateButton.remove();
    this.overlays.delete(id);
  }
}
