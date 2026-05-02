const CONTENT_SCRIPT = "assets/content.js";

async function openSelector(tabId?: number): Promise<void> {
  if (!tabId) return;

  await chrome.scripting.executeScript({
    target: { tabId },
    files: [CONTENT_SCRIPT],
  });
}

chrome.action.onClicked.addListener((tab) => {
  void openSelector(tab.id);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "open-selector") return;

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    void openSelector(tab?.id);
  });
});
