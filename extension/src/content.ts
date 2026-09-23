// Adds one floating "Build an app from this sheet" badge to Google Sheets.
// Touches nothing in the Sheets page beyond appending this element.
import { Message, parseSheetUrl } from "./shared";

const BADGE_ID = "autoapps-badge";

function ensureBadge() {
  const onSheet = parseSheetUrl(location.href) !== null;
  const existing = document.getElementById(BADGE_ID);
  if (!onSheet) {
    existing?.remove();
    return;
  }
  if (existing) return;

  const badge = document.createElement("button");
  badge.id = BADGE_ID;
  badge.type = "button";
  badge.title = "Open AutoApps";
  badge.textContent = "⚡ Build an app from this sheet";
  Object.assign(badge.style, {
    position: "fixed",
    right: "24px",
    bottom: "72px", // above the sheet tabs bar
    zIndex: "2147483000",
    padding: "10px 16px",
    border: "none",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
    color: "#fff",
    font: "600 13px/1.2 Roboto, Arial, sans-serif",
    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
    cursor: "pointer",
  } satisfies Partial<CSSStyleDeclaration>);

  badge.addEventListener("click", () => {
    const message: Message = { type: "OPEN_PANEL" };
    chrome.runtime.sendMessage(message).catch(() => {});
  });

  document.body.appendChild(badge);
}

ensureBadge();
// Switching sheet tabs changes #gid; the background script tells the panel
window.addEventListener("hashchange", ensureBadge);
