import { buildPromptText, type PromptElementContext } from "../../entities/prompt-composition";
import type { ElementId } from "../../entities/element-selection";

export interface PromptContextReader {
  read(id: ElementId, index: number): PromptElementContext | null;
}

export interface ClipboardPort {
  writeText(text: string): Promise<void>;
}

export async function copyPrompt(params: {
  selectedIds: ElementId[];
  annotations: Record<ElementId, string>;
  pagePath: string;
  contextReader: PromptContextReader;
  clipboard: ClipboardPort;
}): Promise<boolean> {
  const elements = params.selectedIds
    .map((id, index) => params.contextReader.read(id, index + 1))
    .filter((context): context is PromptElementContext => Boolean(context));

  const text = buildPromptText({
    pagePath: params.pagePath,
    elements,
    annotations: params.annotations,
  });

  if (!text) return false;

  await params.clipboard.writeText(text);
  return true;
}
