import { NS } from "../../shared/dom/constants";
import { extensionAssetUrl } from "../../shared/extension/extension-asset-url";
import { HELP_HUB_HTML_PATH } from "../../shared/extension/extension-html-paths";
import { FIRST_THREE_STEPS } from "./first-steps";
import { markFirstThreeOnboardingDone } from "./onboarding-storage";

export class EditorOnboarding {
  private host: HTMLDivElement | null = null;
  private stepIndex = 0;
  private rafId: number | null = null;
  private imgEl: HTMLImageElement | null = null;
  private stepLabelEl: HTMLElement | null = null;
  private titleEl: HTMLElement | null = null;
  private bodyEl: HTMLElement | null = null;
  private primaryBtn: HTMLButtonElement | null = null;
  private dotsWrap: HTMLElement | null = null;

  constructor(
    private readonly anchor: () => HTMLElement | null,
    private readonly onDismissed?: () => void,
  ) {}

  mount(): void {
    if (this.host) return;

    const root = document.createElement("div");
    root.className = `${NS}-root ${NS}-onboarding`;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "false");
    root.setAttribute("aria-label", "Selector 使用引导");

    const url = extensionAssetUrl("assets/tutorial/placeholder.gif");

    root.innerHTML = `
      <div class="${NS}-onboarding-inner">
        <p class="${NS}-onboarding-step" aria-live="polite"></p>
        <h2 class="${NS}-onboarding-title"></h2>
        <div class="${NS}-onboarding-media">
          ${url ? `<img class="${NS}-onboarding-gif" alt="" decoding="async" />` : `<div class="${NS}-onboarding-gif-fallback">GIF 占位</div>`}
        </div>
        <p class="${NS}-onboarding-body"></p>
        <p class="${NS}-onboarding-hub-wrap">
          <button type="button" class="${NS}-onboarding-hub">查看扩展内完整教程</button>
        </p>
        <div class="${NS}-onboarding-footer">
          <div class="${NS}-onboarding-dots"></div>
          <div class="${NS}-onboarding-actions">
            <button type="button" class="${NS}-onboarding-skip">跳过</button>
            <button type="button" class="${NS}-onboarding-next"></button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(root);
    this.host = root;

    this.stepLabelEl = root.querySelector(`.${NS}-onboarding-step`);
    this.titleEl = root.querySelector(`.${NS}-onboarding-title`);
    this.bodyEl = root.querySelector(`.${NS}-onboarding-body`);
    this.primaryBtn = root.querySelector(`.${NS}-onboarding-next`);
    this.dotsWrap = root.querySelector(`.${NS}-onboarding-dots`);
    this.imgEl = root.querySelector<HTMLImageElement>(`.${NS}-onboarding-gif`);

    if (this.imgEl && url) {
      this.imgEl.src = url;
    }

    root.querySelector(`.${NS}-onboarding-skip`)!.addEventListener("click", () => this.finish());
    this.primaryBtn!.addEventListener("click", () => this.onPrimary());
    root.querySelector(`.${NS}-onboarding-hub`)!.addEventListener("click", () => {
      window.open(extensionAssetUrl(HELP_HUB_HTML_PATH), "_blank", "noopener");
    });

    this.renderStep();
    this.startPositionLoop();
  }

  destroy(): void {
    this.stopPositionLoop();
    this.host?.remove();
    this.host = null;
    this.imgEl = null;
    this.stepLabelEl = null;
    this.titleEl = null;
    this.bodyEl = null;
    this.primaryBtn = null;
    this.dotsWrap = null;
  }

  private finish(): void {
    markFirstThreeOnboardingDone();
    this.destroy();
    this.onDismissed?.();
  }

  private onPrimary(): void {
    if (this.stepIndex >= FIRST_THREE_STEPS.length - 1) {
      this.finish();
      return;
    }
    this.stepIndex += 1;
    this.renderStep();
  }

  private renderStep(): void {
    const step = FIRST_THREE_STEPS[this.stepIndex];
    const n = FIRST_THREE_STEPS.length;

    if (this.stepLabelEl) {
      this.stepLabelEl.textContent = `第 ${this.stepIndex + 1} / ${n} 步`;
    }
    if (this.titleEl) this.titleEl.textContent = step.title;
    if (this.bodyEl) this.bodyEl.textContent = step.body;
    if (this.imgEl) this.imgEl.alt = step.imageAlt;

    if (this.primaryBtn) {
      this.primaryBtn.textContent = this.stepIndex >= n - 1 ? "开始使用" : "下一步";
    }

    if (this.dotsWrap) {
      this.dotsWrap.innerHTML = "";
      for (let i = 0; i < n; i += 1) {
        const dot = document.createElement("span");
        dot.className = `${NS}-onboarding-dot${i === this.stepIndex ? ` ${NS}-onboarding-dot-active` : ""}`;
        dot.setAttribute("aria-hidden", "true");
        this.dotsWrap.appendChild(dot);
      }
    }
  }

  private startPositionLoop(): void {
    const tick = () => {
      if (!this.host) {
        this.rafId = null;
        return;
      }
      this.positionNearAnchor();
      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }

  private stopPositionLoop(): void {
    if (this.rafId != null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private positionNearAnchor(): void {
    if (!this.host) return;
    const el = this.anchor();
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 10;
    const right = Math.max(8, window.innerWidth - r.right);
    const bottom = Math.max(8, window.innerHeight - r.top + gap);
    this.host.style.right = `${right}px`;
    this.host.style.bottom = `${bottom}px`;
  }
}
