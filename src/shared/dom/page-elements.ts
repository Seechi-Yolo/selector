import { AI_ID, EMBEDDED_EDITOR_HOST_CLASS, NS } from "./constants";

let generatedIdCounter = 0;

function truncatePlainText(value: string | null | undefined, max: number): string {
  if (!value) return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

/** 在任意 `.${NS}-root` 子树内（浮动主面板、批注按钮等） */
export function isEditorElement(el: EventTarget | null): boolean {
  return el instanceof Element && !!el.closest(`.${NS}-root`);
}

/** 浮动/内嵌扩展 UI：含 `.${NS}-root` 与内嵌主面板宿主（宿主上可能没有 ai-editor-root 祖先） */
export function isExtensionUiSurface(el: EventTarget | null): boolean {
  if (!(el instanceof Element)) return false;
  if (el.closest(`.${NS}-root`)) return true;
  return Boolean(el.closest(`.${EMBEDDED_EDITOR_HOST_CLASS}`));
}

/** 宿主页面上原生可编辑控件（非扩展 UI），避免扩展快捷键抢走 Delete/Backspace */
export function isHostNativeEditableSurface(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (isExtensionUiSurface(el)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return Boolean(el.closest(`input, textarea, select, [contenteditable="true"]`));
}

export function assignElementIds(root: Element): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node: Node | null;

  while ((node = walker.nextNode())) {
    if (!(node instanceof Element)) continue;
    if (isExtensionUiSurface(node)) continue;
    if (!node.hasAttribute(AI_ID)) node.setAttribute(AI_ID, createElementId());
  }
}

export function elementId(el: Element): string {
  const existing = el.getAttribute(AI_ID);
  if (existing) return existing;

  const id = createElementId();
  el.setAttribute(AI_ID, id);
  return id;
}

function createElementId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  generatedIdCounter += 1;
  return `selector-${Date.now().toString(36)}-${generatedIdCounter.toString(36)}`;
}

export function byElementId(id: string): Element | null {
  return document.querySelector(`[${AI_ID}="${CSS.escape(id)}"]`);
}

export function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 && rect.height < 2) return false;

  const styles = getComputedStyle(el);
  return styles.display !== "none" && styles.visibility !== "hidden" && styles.opacity !== "0";
}

export function hasDirectText(el: Element): boolean {
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return true;
  }
  return false;
}

export function isMeaningful(el: Element): boolean {
  if (hasDirectText(el)) return true;
  if (el.querySelector("img,video,canvas,svg,button,a,input,select,textarea,iframe")) return true;
  if (el.children.length > 1) return true;
  return false;
}

export function resolveTarget(el: EventTarget | null): Element | null {
  if (!(el instanceof Element)) return null;

  let current: Element | null = el;
  while (current && current !== document.body && current !== document.documentElement) {
    if (isEditorElement(current)) {
      current = current.parentElement;
      continue;
    }
    if (!isVisible(current)) {
      current = current.parentElement;
      continue;
    }
    if (isMeaningful(current)) return current;
    current = current.parentElement;
  }

  return el;
}

export function meaningfulElements(): Element[] {
  return Array.from(document.querySelectorAll(`[${AI_ID}]`)).filter(
    (el) => !isExtensionUiSurface(el) && isVisible(el) && isMeaningful(el),
  );
}

export function elementLabel(el: Element): string {
  if (el.id) return `#${el.id}`;
  if (el.classList.length) return `.${el.classList[0]}`;

  const tag = el.tagName.toLowerCase();
  const text = truncatePlainText(el.textContent, 20);
  if (text) return `${tag} "${text}"`;

  return `<${tag}>`;
}

export function buildSelector(el: Element): string {
  if (el.id) return `#${el.id}`;

  const parts: string[] = [];
  let node: Element | null = el;

  while (node && node !== document.body && node !== document.documentElement) {
    let segment = node.tagName.toLowerCase();
    if (node.id) {
      parts.unshift(`#${node.id}`);
      break;
    }

    const parent = node.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((child) => child.tagName === node?.tagName);
      if (siblings.length > 1) segment += `:nth-of-type(${siblings.indexOf(node) + 1})`;
    }

    parts.unshift(segment);
    node = node.parentElement;
  }

  return parts.join(" > ");
}
