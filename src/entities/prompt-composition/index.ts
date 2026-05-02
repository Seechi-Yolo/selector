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

export interface PromptDocument {
  pagePath: string;
  elements: PromptElementContext[];
  annotations: Record<ElementId, string>;
}

export function buildPromptText(document: PromptDocument): string {
  if (document.elements.length === 0) return "";

  const lines = [`Page: ${document.pagePath}`, ""];

  for (const element of document.elements) {
    lines.push(`${element.index}. ${element.label} <${element.tag}>`);
    if (element.selector) lines.push(`   selector: ${element.selector}`);
    if (element.source) lines.push(`   source: ${element.source}`);
    if (element.react) lines.push(`   react: ${element.react}`);
    if (element.text) lines.push(`   text: "${element.text}"`);
    for (const [key, value] of Object.entries(element.dataAttrs)) {
      lines.push(`   ${key}: ${value}`);
    }
    if (element.outerHTML) lines.push(`   html: ${element.outerHTML}`);

    const annotation = document.annotations[element.id];
    if (annotation) lines.push(`   instruction: ${annotation}`);
  }

  return lines.join("\n");
}

export function truncate(value: string | null | undefined, max: number): string {
  if (!value) return "";

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}
