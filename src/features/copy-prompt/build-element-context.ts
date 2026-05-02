import type { ElementId } from "../../entities/element-selection";
import { truncate, type PromptElementContext } from "../../entities/prompt-composition";
import { AI_ID } from "../../shared/dom/constants";
import { byElementId, buildSelector, elementLabel } from "../../shared/dom/page-elements";
import { getReactDebug } from "../../shared/dom/react-debug";

/** 从当前文档 DOM 组装单条 `PromptElementContext`（基础设施读模型，供 `copyPrompt` 注入）。 */
export function buildElementContext(id: ElementId, index: number): PromptElementContext | null {
  const el = byElementId(id);
  if (!el) return null;

  const dataAttrs: Record<string, string> = {};
  for (const attr of el.attributes) {
    if (attr.name.startsWith("data-") && attr.name !== AI_ID) dataAttrs[attr.name] = attr.value;
  }

  return {
    id,
    index,
    label: elementLabel(el),
    selector: buildSelector(el),
    tag: el.tagName.toLowerCase(),
    text: truncate(el.textContent, 80),
    outerHTML: el.outerHTML.slice(0, 200),
    dataAttrs,
    ...getReactDebug(el),
  };
}
