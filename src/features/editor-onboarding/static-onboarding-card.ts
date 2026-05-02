import { NS } from "../../shared/dom/constants";
import type { OnboardingStepCopy } from "./first-steps";

function tutorialPlaceholderGifUrl(): string {
  try {
    if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
      return chrome.runtime.getURL("assets/tutorial/placeholder.gif");
    }
  } catch {
    /* ignore */
  }
  return "";
}

/**
 * 与 EditorOnboarding 卡片同结构、同 CSS 类名，用于独立教程页并列展示全文，不参与 localStorage。
 */
export function createStaticOnboardingCard(
  step: OnboardingStepCopy,
  stepIndex1: number,
  total: number,
): HTMLElement {
  const root = document.createElement("article");
  root.className = `${NS}-root ${NS}-onboarding ${NS}-onboarding--static`;

  const url = tutorialPlaceholderGifUrl();
  const media = url
    ? `<img class="${NS}-onboarding-gif" alt="" decoding="async" src="${url}" />`
    : `<div class="${NS}-onboarding-gif-fallback">GIF 占位</div>`;

  root.innerHTML = `
    <div class="${NS}-onboarding-inner">
      <p class="${NS}-onboarding-step">第 ${stepIndex1} / ${total} 步（全文）</p>
      <h2 class="${NS}-onboarding-title"></h2>
      <div class="${NS}-onboarding-media">${media}</div>
      <p class="${NS}-onboarding-body"></p>
      <p class="${NS}-onboarding-static-hint">静态展示 · 交互式三步引导请在网页中使用扩展</p>
    </div>
  `;

  root.querySelector(`.${NS}-onboarding-title`)!.textContent = step.title;
  root.querySelector(`.${NS}-onboarding-body`)!.textContent = step.body;
  const img = root.querySelector<HTMLImageElement>(`.${NS}-onboarding-gif`);
  if (img) img.alt = step.imageAlt;

  return root;
}
