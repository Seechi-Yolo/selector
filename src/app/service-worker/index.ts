import { HELP_HUB_HTML_PATH } from "../../shared/extension/extension-html-paths";

const CONTENT_SCRIPT = "assets/content.js";
const MENU_HELP_HUB_ID = "selector-context-help-hub";

function isOwnExtensionPageUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.startsWith(`chrome-extension://${chrome.runtime.id}/`);
}

/**
 * 普通网页只注入顶层 frame：若使用 `allFrames: true`，任一子 frame 注入失败会导致整次 API reject，
 * 主文档也不会挂上 Selector。扩展内页（含 Help Hub 内嵌 iframe）需注入所有 frame。
 */
async function openSelector(tabId?: number, tabUrl?: string): Promise<void> {
  if (tabId == null) return;

  const allFrames = isOwnExtensionPageUrl(tabUrl);

  try {
    await chrome.scripting.executeScript({
      target: allFrames ? { tabId, allFrames: true } : { tabId },
      files: [CONTENT_SCRIPT],
    });
  } catch {
    /* 当前标签不可注入时 executeScript 会 reject，避免未处理的 Promise 打挂 SW */
  }
}

function registerActionContextMenu(): void {
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      return;
    }
    chrome.contextMenus.create(
      {
        id: MENU_HELP_HUB_ID,
        title: "使用教程与沙箱",
        contexts: ["action"],
      },
      () => {
        void chrome.runtime.lastError;
      },
    );
  });
}

registerActionContextMenu();
chrome.runtime.onInstalled.addListener(registerActionContextMenu);

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_HELP_HUB_ID) return;
  chrome.tabs.create({ url: chrome.runtime.getURL(HELP_HUB_HTML_PATH) });
});

chrome.action.onClicked.addListener((tab) => {
  void openSelector(tab.id ?? undefined, tab.url);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "open-selector") return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    void openSelector(tab?.id, tab?.url);
  });
});
