import { ensureSelectorApp } from "../../app/content/selector-boot";
import {
  isSelectorExtensionPageOpenMessage,
} from "./selector-extension-page-message";

let installed = false;

/**
 * 教程/沙箱等扩展内页无法被 `scripting.executeScript` 注入，需在页面内监听
 * background 广播并直接启动 Selector。
 */
export function installSelectorExtensionPageActionListener(): void {
  if (installed) return;
  installed = true;

  chrome.runtime.onMessage.addListener((message: unknown) => {
    if (!isSelectorExtensionPageOpenMessage(message)) return;

    chrome.tabs.getCurrent((tab) => {
      if (chrome.runtime.lastError != null || tab?.id !== message.targetTabId) {
        return;
      }

      const frame = window.frameElement;
      if (
        frame instanceof HTMLIFrameElement &&
        !frame.classList.contains("help-hub-frame-visible")
      ) {
        return;
      }

      void ensureSelectorApp();
    });
  });
}
