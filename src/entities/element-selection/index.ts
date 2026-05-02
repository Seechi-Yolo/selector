export type ElementId = string;

export interface SelectionState {
  selectedIds: ElementId[];
}

export function createSelectionState(selectedIds: ElementId[] = []): SelectionState {
  return { selectedIds: [...selectedIds] };
}

export function selectOnly(id: ElementId): SelectionState {
  return { selectedIds: [id] };
}

export function addSelection(state: SelectionState, id: ElementId): SelectionState {
  if (state.selectedIds.includes(id)) return createSelectionState(state.selectedIds);
  return { selectedIds: [...state.selectedIds, id] };
}

export function addSelections(state: SelectionState, ids: ElementId[]): SelectionState {
  return ids.reduce(addSelection, createSelectionState(state.selectedIds));
}

export function removeSelection(state: SelectionState, id: ElementId): SelectionState {
  return { selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id) };
}

export function toggleSelection(state: SelectionState, id: ElementId): SelectionState {
  return state.selectedIds.includes(id) ? removeSelection(state, id) : addSelection(state, id);
}

export function clearSelection(): SelectionState {
  return { selectedIds: [] };
}
