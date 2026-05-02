import type { ElementId } from "../element-selection";

export interface PromptElementContext {
  id: ElementId;
  index: number;
  label: string;
  selector: string;
  tag: string;
  text: string;
  outerHTML: string;
  dataAttrs: Record<string, string>;
  source?: string;
  react?: string;
}

export interface PromptPayload {
  pagePath: string;
  elements: PromptElementContext[];
  annotations: Record<ElementId, string>;
  /** D-14：整次选取集说明；线性串接时默认在逐项列表前 */
  selectionLevelInstruction?: string;
}

export function buildPromptText(payload: PromptPayload): string {
  if (payload.elements.length === 0) return "";

  const lines = [`Page: ${payload.pagePath}`, ""];

  const overall = payload.selectionLevelInstruction?.trim();
  if (overall) {
    lines.push("Selection-level instruction:");
    lines.push(overall);
    lines.push("");
  }

  for (const element of payload.elements) {
    lines.push(`${element.index}. ${element.label} <${element.tag}>`);
    if (element.selector) lines.push(`   selector: ${element.selector}`);
    if (element.source) lines.push(`   source: ${element.source}`);
    if (element.react) lines.push(`   react: ${element.react}`);
    if (element.text) lines.push(`   text: "${element.text}"`);
    for (const [key, value] of Object.entries(element.dataAttrs)) {
      lines.push(`   ${key}: ${value}`);
    }
    if (element.outerHTML) lines.push(`   html: ${element.outerHTML}`);

    const annotation = payload.annotations[element.id];
    if (annotation) lines.push(`   instruction: ${annotation}`);
  }

  return lines.join("\n");
}

export function truncate(value: string | null | undefined, max: number): string {
  if (!value) return "";

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}
