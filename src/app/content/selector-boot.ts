import { SelectorContentApp } from "./selector-content-app";
import { NS } from "../../shared/dom/constants";

let bootPromise: Promise<void> | null = null;

function removeOrphanFloatingPanels(): void {
  document.querySelectorAll(`.${NS}-root.${NS}-chat`).forEach((el) => el.remove());
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
