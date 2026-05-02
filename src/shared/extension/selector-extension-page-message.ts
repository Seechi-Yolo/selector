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
