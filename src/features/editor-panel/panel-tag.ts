import type { ElementId } from "../../entities/element-selection";

export interface PanelTag {
  id: ElementId;
  label: string;
  hasAnnotation: boolean;
}
