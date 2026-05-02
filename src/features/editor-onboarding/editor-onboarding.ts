import { NS } from "../../shared/dom/constants";
import { markFirstThreeOnboardingDone } from "./onboarding-storage";

/** 须与 `shared/extension/selector-extension-page-message.ts` 中 `OPEN_HELP_HUB_TAB_TYPE` 字面量完全一致（勿改拆字），否则 SW 收不到消息。 */
const OPEN_HELP_HUB_TAB_TYPE = "selector/open-help-hub-tab" as const;

const INTRO_TITLE = "欢迎使用 Selector";
const INTRO_BODY =
  "第一次使用？建议打开扩展内「使用教程」浏览图示说明与快捷键；也可稍后在扩展图标右键菜单中随时打开。";

export class EditorOnboarding {
  private host: HTMLDivElement | null = null;
  private rafId: number | null = null;

  constructor(
    private readonly anchor: () => HTMLElement | null,
    private readonly onDismissed?: () => void,
  ) {}

  mount(): void {
    if (this.host) return;

    const root = document.createElement("div");
    root.className = `${NS}-root ${NS}-onboarding ${NS}-onboarding--compact`;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "false");
    root.setAttribute("aria-label", "Selector 使用引导");

    const inner = document.createElement("div");
    inner.className = `${NS}-onboarding-inner`;

    const title = document.createElement("h2");
    title.className = `${NS}-onboarding-title`;
    title.textContent = INTRO_TITLE;

    const body = document.createElement("p");
    body.className = `${NS}-onboarding-body`;
    body.textContent = INTRO_BODY;

    const footer = document.createElement("div");
    footer.className = `${NS}-onboarding-footer ${NS}-onboarding-footer--compact`;

    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = `${NS}-onboarding-skip`;
    skip.textContent = "跳过";

    const next = document.createElement("button");
    next.type = "button";
    next.className = `${NS}-onboarding-next`;
    next.textContent = "打开使用教程";

    footer.append(skip, next);
    inner.append(title, body, footer);
    root.appendChild(inner);

    const mountParent = document.body ?? document.documentElement;
    mountParent.appendChild(root);
    this.host = root;

    skip.addEventListener("click", () => void this.finishFromSkip());
    next.addEventListener("click", () => void this.openTutorialAndFinish());

    this.startPositionLoop();
  }

  destroy(): void {
    this.stopPositionLoop();
    this.host?.remove();
    this.host = null;
  }

  private async openTutorialAndFinish(): Promise<void> {
    try {
      chrome.runtime.sendMessage({ type: OPEN_HELP_HUB_TAB_TYPE }, () => {
        void chrome.runtime.lastError;
      });
    } catch {
      /* ignore */
    }
    await this.persistDismissAndTeardown();
  }

  private async finishFromSkip(): Promise<void> {
    await this.persistDismissAndTeardown();
  }

  private async persistDismissAndTeardown(): Promise<void> {
    await markFirstThreeOnboardingDone();
    this.destroy();
    this.onDismissed?.();
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
    if (!el) {
      this.host.style.right = "16px";
      this.host.style.bottom = "16px";
      return;
    }
    const r = el.getBoundingClientRect();
    const gap = 10;
    const right = Math.max(8, window.innerWidth - r.right);
    const bottom = Math.max(8, window.innerHeight - r.top + gap);
    this.host.style.right = `${right}px`;
    this.host.style.bottom = `${bottom}px`;
  }
}
