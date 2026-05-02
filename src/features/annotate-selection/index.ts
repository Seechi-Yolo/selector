import type { ElementId } from "../../entities/element-selection";
import type { SelectionController } from "../select-elements";

export function saveAnnotation(controller: SelectionController, id: ElementId, value: string): void {
  controller.setAnnotation(id, value);
}

export function clearSelectionAnnotation(controller: SelectionController, id: ElementId): void {
  controller.clearAnnotation(id);
}
