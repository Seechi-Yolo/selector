import editorChromeCss from "../../../assets/editor.css?raw";
import { NS } from "../dom/constants";

const STYLE_ELEMENT_ID = "selector-editor-style";

/**
 * 主面板及相关浮动层（选取框、批注等）的全局样式，唯一来源 `assets/editor.css`。
 * 与「可交互主面板」`EditorPanel` 解耦：沙箱只依赖本对象注入样式 + 静态壳 DOM。
 */
export function injectEditorChromeTheme(): void {
  if (document.getElementById(STYLE_ELEMENT_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  try {
    style.appendChild(document.createTextNode(editorChromeCss));
  } catch {
    style.textContent = editorChromeCss;
  }
  try {
    (document.head ?? document.documentElement).appendChild(style);
  } catch {
    /* 极端 CSP 下放弃全局样式 */
  }
}

export function removeEditorChromeTheme(): void {
  /** 沙箱等处仍有仅外观壳时不能抽走样式，否则与关闭可会话主面板互相影响 */
  if (document.querySelector("[data-selector-editor-chrome-shell]")) return;
  if (document.querySelector(`.${NS}-root.${NS}-chat.${NS}-chat--sandbox`)) return;
  document.getElementById(STYLE_ELEMENT_ID)?.remove();
}

/** 主面板及相关 overlay 的全局样式域对象（与可交互 `EditorPanel` 分离） */
export const EditorChromeTheme = {
  inject: injectEditorChromeTheme,
  remove: removeEditorChromeTheme,
} as const;
