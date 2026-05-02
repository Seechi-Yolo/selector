const CONTENT_SCRIPT = "assets/content.js";
const MENU_TUTORIAL_ID = "selector-context-tutorial";
/** 与 content script 监听类型保持一致（勿改一半） */
const SHOW_TUTORIAL_MESSAGE_TYPE = "selector:show-tutorial";

async function openSelector(tabId?: number): Promise<void> {
  if (!tabId) return;

  await chrome.scripting.executeScript({
    target: { tabId },
    files: [CONTENT_SCRIPT],
  });
}

function registerActionContextMenu(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_TUTORIAL_ID,
      title: "查看使用教程",
      contexts: ["action"],
    });
  });
}

registerActionContextMenu();
chrome.runtime.onInstalled.addListener(registerActionContextMenu);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_TUTORIAL_ID || tab?.id == null) return;
  const tabId = tab.id;

  void (async () => {
    try {
      await openSelector(tabId);
      await chrome.tabs.sendMessage(tabId, { type: SHOW_TUTORIAL_MESSAGE_TYPE });
    } catch {
      /* 页面不可注入或未收到消息时忽略 */
    }
  })();
});

chrome.action.onClicked.addListener((tab) => {
  void openSelector(tab.id);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "open-selector") return;

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    void openSelector(tab && tab.id);
  });
});
