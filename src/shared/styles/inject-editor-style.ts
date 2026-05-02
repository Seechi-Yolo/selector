import cssText from "../../../assets/editor.css?raw";

const STYLE_ID = "selector-editor-style";

export function injectEditorStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = cssText;
  document.head.appendChild(style);
}

export function removeEditorStyle(): void {
  document.getElementById(STYLE_ID)?.remove();
}
