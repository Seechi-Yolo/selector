import { SelectorContentApp } from "./selector-content-app";
import { NS } from "../../shared/dom/constants";

let bootPromise: Promise<void> | null = null;

/** 只清掉右下角浮动主面板；沙箱/教程里 `layout: "sandbox"` 的预览面板带 `${NS}-chat--sandbox`，必须保留，否则与扩展启动互相踩。 */
function removeOrphanFloatingPanels(): void {
  document.querySelectorAll(`.${NS}-root.${NS}-chat`).forEach((el) => {
    if (el.classList.contains(`${NS}-chat--sandbox`)) return;
    el.remove();
  });
}

export async function ensureSelectorApp(): Promise<void> {
  if (window.__selectorApp) return;

  if (!bootPromise) {
    bootPromise = (async () => {
      try {
        if (document.readyState === "loading") {
          await new Promise<void>((resolve) => {
            document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
          });
        }
        if (window.__selectorApp) return;

        removeOrphanFloatingPanels();

        const app = new SelectorContentApp();
        window.__selectorApp = app;
        app.init();
      } finally {
        bootPromise = null;
      }
    })();
  }

  await bootPromise;
}
