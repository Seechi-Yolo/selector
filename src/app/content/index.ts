import "./selector-content-app";
import { SelectorContentApp } from "./selector-content-app";

function boot(): void {
  if (window.__selectorApp) return;

  const app = new SelectorContentApp();
  window.__selectorApp = app;
  app.init();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
