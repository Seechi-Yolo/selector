import "./selector-content-app";
import { SelectorContentApp } from "./selector-content-app";

/** 与 service worker `tabs.sendMessage` 类型保持一致（勿改一半） */
const SHOW_TUTORIAL_MESSAGE_TYPE = "selector:show-tutorial";

function boot(): void {
  if (window.__selectorApp) return;

  const app = new SelectorContentApp();
  window.__selectorApp = app;
  app.init();
}

function scheduleBoot(): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
}

async function waitForDomReady(): Promise<void> {
  if (document.readyState !== "loading") return;
  await new Promise<void>((resolve) => {
    document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
  });
}

async function openTutorialFromExtensionMenu(): Promise<void> {
  await waitForDomReady();
  if (!window.__selectorApp) {
    const app = new SelectorContentApp();
    window.__selectorApp = app;
    app.init();
  }
  (window.__selectorApp as SelectorContentApp).openTutorialFromMenu();
}

const win = window as Window & { __selectorMessageHook?: true };
if (!win.__selectorMessageHook) {
  win.__selectorMessageHook = true;
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === SHOW_TUTORIAL_MESSAGE_TYPE) {
      void openTutorialFromExtensionMenu();
    }
  });
}

scheduleBoot();
