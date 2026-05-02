import { HELP_HUB_HTML_PATH } from "../../shared/extension/extension-html-paths";
import {
  isOpenHelpHubTabMessage,
  SELECTOR_EXTENSION_PAGE_OPEN_TYPE,
  type SelectorExtensionPageOpenMessage,
} from "../../shared/extension/selector-extension-page-message";

const CONTENT_SCRIPT = "assets/content.js";
const MENU_HELP_HUB_ID = "selector-context-help-hub";

function isOwnExtensionPageUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.startsWith(`chrome-extension://${chrome.runtime.id}/`);
}

function tabResolvedUrl(tab: chrome.tabs.Tab): string | undefined {
  return tab.url ?? tab.pendingUrl;
}

/** 仅向普通网页注入：顶层 frame；子 frame 失败会导致整次 reject，故不用 allFrames。 */
async function tryInjectContentScript(tabId: number): Promise<boolean> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [CONTENT_SCRIPT],
    });
    return true;
  } catch {
    return false;
  }
}

function openSelectorOnExtensionPages(tabId: number): void {
  const msg: SelectorExtensionPageOpenMessage = {
    type: SELECTOR_EXTENSION_PAGE_OPEN_TYPE,
    targetTabId: tabId,
  };
  /* MV3 SW 里 Promise 版 sendMessage 在「无接收端」时会 reject，未处理会拖垮后续 executeScript */
  chrome.runtime.sendMessage(msg, () => {
    void chrome.runtime.lastError;
  });
}

async function activateSelectorForTab(tab: chrome.tabs.Tab): Promise<void> {
  const tabId = tab.id;
  if (tabId == null) return;

  const resolvedUrl = tabResolvedUrl(tab);
  if (isOwnExtensionPageUrl(resolvedUrl)) {
    openSelectorOnExtensionPages(tabId);
    return;
  }

  const injected = await tryInjectContentScript(tabId);
  if (!injected) {
    openSelectorOnExtensionPages(tabId);
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
        title: "教程、沙箱与设计系统",
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

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (!isOpenHelpHubTabMessage(message)) return;
  chrome.tabs.create({ url: chrome.runtime.getURL(HELP_HUB_HTML_PATH) });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_HELP_HUB_ID) return;
  chrome.tabs.create({ url: chrome.runtime.getURL(HELP_HUB_HTML_PATH) });
});

chrome.action.onClicked.addListener((tab) => {
  void activateSelectorForTab(tab);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "open-selector") return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab == null) return;
    void activateSelectorForTab(tab);
  });
});
