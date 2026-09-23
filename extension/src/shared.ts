// Shared between background, content script and side panel.
declare global {
  const APP_ORIGIN: string; // injected by build.mjs
}

export interface SheetRef {
  spreadsheetId: string;
  gid?: number;
}

export type Message = { type: "OPEN_PANEL" } | ({ type: "SHEET_CHANGED" } & Partial<SheetRef>);

export function parseSheetUrl(url: string | undefined): SheetRef | null {
  if (!url) return null;
  const id = url.match(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  if (!id) return null;
  const gid = url.match(/[#&?]gid=(\d+)/)?.[1];
  return gid === undefined ? { spreadsheetId: id } : { spreadsheetId: id, gid: Number(gid) };
}

export function panelUrl(sheet: SheetRef | null): string {
  if (!sheet) return `${APP_ORIGIN}/extension/panel`;
  const params = new URLSearchParams({ spreadsheetId: sheet.spreadsheetId });
  if (sheet.gid !== undefined) params.set("gid", String(sheet.gid));
  return `${APP_ORIGIN}/extension/panel?${params}`;
}
