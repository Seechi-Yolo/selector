import cssText from "../../../assets/editor.css?raw";

const STYLE_ID = "selector-editor-style";

export function injectEditorStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  try {
    style.appendChild(document.createTextNode(cssText));
  } catch {
    style.textContent = cssText;
  }
  try {
    (document.head ?? document.documentElement).appendChild(style);
  } catch {
    /* 极端 CSP 下放弃全局样式，引导层仍可由 DOM 挂载（样式可能不完整） */
  }
}

export function removeEditorStyle(): void {
  document.getElementById(STYLE_ID)?.remove();
}
