// Hosts the web app's /extension/panel in an iframe and keeps it pointed at
// whichever spreadsheet (and sheet tab) is in front.
import { Message, panelUrl, parseSheetUrl, SheetRef } from "./shared";

const frame = document.getElementById("app") as HTMLIFrameElement;
let current: string | null = null;

function show(sheet: SheetRef | null) {
  const key = sheet ? `${sheet.spreadsheetId}#${sheet.gid ?? ""}` : "";
  if (key === current) return; // same sheet and tab: keep the panel's state
  current = key;
  frame.src = panelUrl(sheet);
}

chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => show(parseSheetUrl(tab?.url)));

chrome.runtime.onMessage.addListener((message: Message) => {
  if (message.type !== "SHEET_CHANGED") return;
  show(message.spreadsheetId ? { spreadsheetId: message.spreadsheetId, gid: message.gid } : null);
});
