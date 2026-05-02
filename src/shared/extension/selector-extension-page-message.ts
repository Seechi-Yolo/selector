/**
 * 内容脚本请求后台打开教程顶栏页（勿用 `window.open(chrome-extension://…)`，易被客户端拦截为 ERR_BLOCKED_BY_CLIENT）。
 * `features/editor-onboarding/editor-onboarding.ts` 内联同名字符串，勿改拆字；该文件不得 import 本模块，否则主内容脚本会失去 IIFE 单文件形态。
 */
export const OPEN_HELP_HUB_TAB_TYPE = "selector/open-help-hub-tab" as const;

export type OpenHelpHubTabMessage = { type: typeof OPEN_HELP_HUB_TAB_TYPE };

export function isOpenHelpHubTabMessage(raw: unknown): raw is OpenHelpHubTabMessage {
  if (typeof raw !== "object" || raw === null) return false;
  return (raw as Record<string, unknown>).type === OPEN_HELP_HUB_TAB_TYPE;
}

/** Service worker 与教程/沙箱扩展内页共用的消息类型，须保持字面量一致。 */
export const SELECTOR_EXTENSION_PAGE_OPEN_TYPE = "selector/extension-page-open-from-action" as const;

export type SelectorExtensionPageOpenMessage = {
  type: typeof SELECTOR_EXTENSION_PAGE_OPEN_TYPE;
  targetTabId: number;
};

export function isSelectorExtensionPageOpenMessage(
  raw: unknown,
): raw is SelectorExtensionPageOpenMessage {
  if (typeof raw !== "object" || raw === null) return false;
  const o = raw as Record<string, unknown>;
  return (
    o.type === SELECTOR_EXTENSION_PAGE_OPEN_TYPE &&
    typeof o.targetTabId === "number"
  );
}
