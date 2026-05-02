const CONTENT_SCRIPT = "assets/content.js";
const MENU_HELP_HUB_ID = "selector-context-help-hub";
/** 与 `vite.tutorial.config.ts` 中 HTML 入口输出路径一致 */
const HELP_HUB_URL = "src/pages/help-hub/help-hub.html";

async function openSelector(tabId?: number): Promise<void> {
  if (tabId == null) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
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
  chrome.tabs.create({ url: chrome.runtime.getURL(HELP_HUB_URL) });
});

chrome.action.onClicked.addListener((tab) => {
  void openSelector(tab.id ?? undefined);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "open-selector") return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    void openSelector(tab?.id);
  });
});
