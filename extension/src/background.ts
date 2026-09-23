import { Message, parseSheetUrl } from "./shared";

const enablePanelOnAction = () =>
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.runtime.onInstalled.addListener(enablePanelOnAction);
chrome.runtime.onStartup.addListener(enablePanelOnAction);

// The badge on the sheet asks us to open the panel for its tab
chrome.runtime.onMessage.addListener((message: Message, sender) => {
  if (message.type === "OPEN_PANEL" && sender.tab?.id !== undefined) {
    chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => {});
  }
});

// Tell an open side panel which sheet is in front; nobody listening is fine
function broadcast(url: string | undefined) {
  const sheet = parseSheetUrl(url);
  const message: Message = { type: "SHEET_CHANGED", ...(sheet ?? {}) };
  chrome.runtime.sendMessage(message).catch(() => {});
}

chrome.tabs.onUpdated.addListener((_tabId, change, tab) => {
  if (tab.active && (change.url !== undefined || change.status === "complete")) broadcast(tab.url);
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  broadcast(tab?.url);
});
