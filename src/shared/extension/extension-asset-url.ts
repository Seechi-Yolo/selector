/** 扩展包内资源 URL；非扩展上下文返回空字符串。 */
export function extensionAssetUrl(relativePath: string): string {
  try {
    if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
      return chrome.runtime.getURL(relativePath);
    }
  } catch {
    /* ignore */
  }
  return "";
}
