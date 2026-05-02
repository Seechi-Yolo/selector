import type { ElementId } from "../element-selection";

export type AnnotationState = Record<ElementId, string>;

export function createAnnotationState(entries: Iterable<[ElementId, string]> = []): AnnotationState {
  return Object.fromEntries(entries);
}

export function setAnnotation(state: AnnotationState, id: ElementId, value: string): AnnotationState {
  const trimmed = value.trim();
  const next = { ...state };

  if (trimmed) next[id] = trimmed;
  else delete next[id];

  return next;
}

export function removeAnnotation(state: AnnotationState, id: ElementId): AnnotationState {
  const next = { ...state };
  delete next[id];
  return next;
}

export function clearAnnotations(): AnnotationState {
  return {};
}
