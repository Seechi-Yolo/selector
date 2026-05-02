import { SelectorContentApp } from "./selector-content-app";
import { NS } from "../../shared/dom/constants";

/** 与 service worker `tabs.sendMessage` 类型保持一致（勿改一半） */
const SHOW_TUTORIAL_MESSAGE_TYPE = "selector:show-tutorial";

/** 同一注入周期内并发 `ensureSelectorApp` 时只跑一次启动逻辑 */
let bootPromise: Promise<void> | null = null;

function removeOrphanFloatingPanels(): void {
  document.querySelectorAll(`.${NS}-root.${NS}-chat`).forEach((el) => el.remove());
}

async function ensureSelectorApp(): Promise<void> {
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

async function openTutorialFromExtensionMenu(): Promise<void> {
  await ensureSelectorApp();
  (window.__selectorApp as SelectorContentApp).openTutorialFromMenu();
}

const win = window as Window & { __selectorMessageHook?: true };
if (!win.__selectorMessageHook) {
  win.__selectorMessageHook = true;
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === SHOW_TUTORIAL_MESSAGE_TYPE) {
      void openTutorialFromExtensionMenu().catch(() => {});
    }
  });
}

void ensureSelectorApp().catch(() => {});
