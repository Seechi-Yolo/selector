import { buildPromptText, type PromptElementContext } from "../../entities/prompt-composition";
import type { ElementId } from "../../entities/element-selection";

export { buildElementContext } from "./build-element-context";

export interface PromptContextReader {
  read(id: ElementId, index: number): PromptElementContext | null;
}

export interface ClipboardPort {
  writeText(text: string): Promise<void>;
}

/** 与 `buildPromptText` / `copyPrompt` 使用相同拼装逻辑，用于 D-08「无可写内容不写」预判（不写剪贴板）。 */
export function wouldCopyPromptProduceText(params: {
  selectedIds: ElementId[];
  annotations: Record<ElementId, string>;
  pagePath: string;
  contextReader: PromptContextReader;
  selectionLevelInstruction?: string;
}): boolean {
  const elements = params.selectedIds
    .map((id, index) => params.contextReader.read(id, index + 1))
    .filter((context): context is PromptElementContext => Boolean(context));

  const text = buildPromptText({
    pagePath: params.pagePath,
    elements,
    annotations: params.annotations,
    selectionLevelInstruction: params.selectionLevelInstruction,
  });

  return text.trim().length > 0;
}

export async function copyPrompt(params: {
  selectedIds: ElementId[];
  annotations: Record<ElementId, string>;
  pagePath: string;
  contextReader: PromptContextReader;
  clipboard: ClipboardPort;
  /** PRD D-14：整次选取集说明（可选） */
  selectionLevelInstruction?: string;
}): Promise<boolean> {
  const elements = params.selectedIds
    .map((id, index) => params.contextReader.read(id, index + 1))
    .filter((context): context is PromptElementContext => Boolean(context));

  const text = buildPromptText({
    pagePath: params.pagePath,
    elements,
    annotations: params.annotations,
    selectionLevelInstruction: params.selectionLevelInstruction,
  });

  if (!text.trim()) return false;

  await params.clipboard.writeText(text);
  return true;
}
