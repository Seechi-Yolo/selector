import { NS } from "../../shared/dom/constants";
import { EditorOnboarding } from "./editor-onboarding";
import { isFirstThreeOnboardingDone } from "./onboarding-storage";

/**
 * 若尚未关闭教程引导且页面上尚无引导根节点，则挂载一次。
 * 在选取会话（主内容脚本）启动时由 `SelectorContentApp` 调用。
 */
export async function tryMountTutorialIntro(
  getAnchor: () => HTMLElement | null,
  onDismissed?: () => void,
): Promise<EditorOnboarding | null> {
  if (await isFirstThreeOnboardingDone()) return null;
  if (document.querySelector(`.${NS}-root.${NS}-onboarding`)) return null;
  const onboarding = new EditorOnboarding(getAnchor, onDismissed);
  onboarding.mount();
  return onboarding;
}
