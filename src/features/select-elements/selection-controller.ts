import {
  addSelection,
  addSelections,
  clearSelection,
  createSelectionState,
  removeSelection,
  selectOnly,
  toggleSelection,
  type ElementId,
  type SelectionState,
} from "../../entities/element-selection";
import {
  clearAnnotations,
  createAnnotationState,
  removeAnnotation,
  setAnnotation,
  type AnnotationState,
} from "../../entities/annotation";

interface EditorSnapshot {
  selection: SelectionState;
  annotations: AnnotationState;
}

export interface EditorViewState {
  selectedIds: ElementId[];
  annotations: AnnotationState;
}

export class SelectionController {
  private selection = createSelectionState();
  private annotations = createAnnotationState();
  private history: EditorSnapshot[] = [];

  snapshot(): EditorViewState {
    return {
      selectedIds: [...this.selection.selectedIds],
      annotations: { ...this.annotations },
    };
  }

  hasSelection(id: ElementId): boolean {
    return this.selection.selectedIds.includes(id);
  }

  getAnnotation(id: ElementId): string {
    return this.annotations[id] ?? "";
  }

  remember(): void {
    this.history.push({
      selection: createSelectionState(this.selection.selectedIds),
      annotations: createAnnotationState(Object.entries(this.annotations)),
    });

    if (this.history.length > 30) this.history.shift();
  }

  selectOnly(id: ElementId): void {
    this.selection = selectOnly(id);
  }

  add(id: ElementId): void {
    this.selection = addSelection(this.selection, id);
  }

  addMany(ids: ElementId[]): void {
    this.selection = addSelections(this.selection, ids);
  }

  toggle(id: ElementId): void {
    this.selection = toggleSelection(this.selection, id);
  }

  remove(id: ElementId): void {
    this.selection = removeSelection(this.selection, id);
    this.annotations = removeAnnotation(this.annotations, id);
  }

  clear(): void {
    this.selection = clearSelection();
    this.annotations = clearAnnotations();
  }

  setAnnotation(id: ElementId, value: string): void {
    this.annotations = setAnnotation(this.annotations, id, value);
  }

  clearAnnotation(id: ElementId): void {
    this.annotations = removeAnnotation(this.annotations, id);
  }

  undo(): boolean {
    const snapshot = this.history.pop();
    if (!snapshot) return false;

    this.selection = snapshot.selection;
    this.annotations = snapshot.annotations;
    return true;
  }
}
