import type { OnboardingStepCopy } from "../../features/editor-onboarding/first-steps";
import { extensionAssetUrl } from "../../shared/extension/extension-asset-url";
import { NS } from "../../shared/dom/constants";

/**
 * 与 EditorOnboarding 卡片同结构、同 CSS 类名，用于扩展内教程/沙箱页并列展示全文。
 * 位于 Bootstrap 展示层，不参与 localStorage；与 `features/editor-onboarding` 中交互式引导并列存在。
 */
export function createStaticOnboardingCard(
  step: OnboardingStepCopy,
  stepIndex1: number,
  total: number,
): HTMLElement {
  const root = document.createElement("article");
  root.className = `${NS}-root ${NS}-onboarding ${NS}-onboarding--static`;

  const url = extensionAssetUrl("assets/tutorial/placeholder.gif");
  const media = url
    ? `<img class="${NS}-onboarding-gif" alt="" decoding="async" src="${url}" />`
    : `<div class="${NS}-onboarding-gif-fallback">GIF 占位</div>`;

  root.innerHTML = `
    <div class="${NS}-onboarding-inner">
      <p class="${NS}-onboarding-step">第 ${stepIndex1} / ${total} 步</p>
      <h2 class="${NS}-onboarding-title"></h2>
      <div class="${NS}-onboarding-media">${media}</div>
      <p class="${NS}-onboarding-body"></p>
    </div>
  `;

  root.querySelector(`.${NS}-onboarding-title`)!.textContent = step.title;
  root.querySelector(`.${NS}-onboarding-body`)!.textContent = step.body;
  const img = root.querySelector<HTMLImageElement>(`.${NS}-onboarding-gif`);
  if (img) img.alt = step.imageAlt;

  return root;
}
