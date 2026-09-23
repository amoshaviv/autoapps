// Google Sheets v4 over raw fetch. Every function takes the access token first.
import { HttpError } from "@/lib/http-error";
import { columnLetter } from "./columns";

export { columnLetter };

const API = "https://sheets.googleapis.com/v4/spreadsheets";
const CACHE_MS = 10_000;

export interface SpreadsheetInfo {
  title: string;
  sheets: { sheetId: number; title: string; rowCount: number; columnCount: number }[];
}

// 'Form Responses 1'!A1 — quotes always, doubled single quotes inside
const sheetRange = (sheetTitle: string, a1?: string) =>
  `'${sheetTitle.replace(/'/g, "''")}'${a1 ? `!${a1}` : ""}`;

async function sheetsFetch<T>(token: string, url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (response.ok) return (await response.json()) as T;

  const body = await response.json().catch(() => null);
  const message: string = body?.error?.message ?? response.statusText;
  if (response.status === 401 || (response.status === 403 && /scope|auth/i.test(message))) {
    throw new HttpError(428, `Connect Google Sheets first (${message})`, "sheets_not_connected");
  }
  if (response.status === 403) {
    throw new HttpError(403, "Your Google account cannot open this spreadsheet", "sheet_forbidden");
  }
  if (response.status === 404) {
    throw new HttpError(404, "Spreadsheet not found", "sheet_not_found");
  }
  throw new HttpError(502, `Google Sheets error: ${message}`);
}

const valuesCache = new Map<string, { at: number; values: string[][] }>();
const cacheKey = (spreadsheetId: string, sheetTitle: string, a1?: string) =>
  `${spreadsheetId}\u0000${sheetTitle}\u0000${a1 ?? ""}`;

function invalidate(spreadsheetId: string, sheetTitle: string) {
  const prefix = `${spreadsheetId}\u0000${sheetTitle}\u0000`;
  for (const key of Array.from(valuesCache.keys())) if (key.startsWith(prefix)) valuesCache.delete(key);
}

export async function getSpreadsheet(token: string, spreadsheetId: string): Promise<SpreadsheetInfo> {
  const data = await sheetsFetch<{
    properties: { title: string };
    sheets: { properties: { sheetId: number; title: string; gridProperties?: { rowCount?: number; columnCount?: number } } }[];
  }>(token, `${API}/${encodeURIComponent(spreadsheetId)}?fields=properties.title,sheets.properties`);

  return {
    title: data.properties.title,
    sheets: data.sheets.map(({ properties: p }) => ({
      sheetId: p.sheetId,
      title: p.title,
      rowCount: p.gridProperties?.rowCount ?? 0,
      columnCount: p.gridProperties?.columnCount ?? 0,
    })),
  };
}

// What users see (FORMATTED_VALUE), row by row; trailing empty cells are omitted by the API
export async function getValues(
  token: string,
  spreadsheetId: string,
  sheetTitle: string,
  a1Range?: string
): Promise<string[][]> {
  const key = cacheKey(spreadsheetId, sheetTitle, a1Range);
  const cached = valuesCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.values;

  const range = encodeURIComponent(sheetRange(sheetTitle, a1Range));
  const data = await sheetsFetch<{ values?: unknown[][] }>(
    token,
    `${API}/${encodeURIComponent(spreadsheetId)}/values/${range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`
  );
  const values = (data.values ?? []).map((row) => row.map((v) => String(v ?? "")));
  valuesCache.set(key, { at: Date.now(), values });
  return values;
}

// Appends one row after the sheet's table; returns its 1-based row number
export async function appendRow(
  token: string,
  spreadsheetId: string,
  sheetTitle: string,
  values: string[]
): Promise<number> {
  const range = encodeURIComponent(sheetRange(sheetTitle, "A1"));
  const data = await sheetsFetch<{ updates: { updatedRange: string } }>(
    token,
    `${API}/${encodeURIComponent(spreadsheetId)}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ values: [values] }) }
  );
  invalidate(spreadsheetId, sheetTitle);

  const match = data.updates.updatedRange.match(/![A-Z]+(\d+)/);
  if (!match) throw new HttpError(502, `Google Sheets error: unexpected range ${data.updates.updatedRange}`);
  return Number(match[1]);
}

// Writes several cells of one row in a single values:batchUpdate
export async function updateCells(
  token: string,
  spreadsheetId: string,
  sheetTitle: string,
  rowNumber: number,
  cells: { columnIndex: number; value: string }[]
): Promise<void> {
  if (cells.length === 0) return;
  await sheetsFetch(token, `${API}/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data: cells.map(({ columnIndex, value }) => ({
        range: sheetRange(sheetTitle, `${columnLetter(columnIndex)}${rowNumber}`),
        values: [[value]],
      })),
    }),
  });
  invalidate(spreadsheetId, sheetTitle);
}

export async function createSpreadsheet(
  token: string,
  title: string,
  sheetTitle: string,
  values: string[][]
): Promise<{ spreadsheetId: string; url: string }> {
  const created = await sheetsFetch<{ spreadsheetId: string; spreadsheetUrl: string }>(token, API, {
    method: "POST",
    body: JSON.stringify({ properties: { title }, sheets: [{ properties: { title: sheetTitle } }] }),
  });
  const width = Math.max(1, ...values.map((r) => r.length));
  const padded = values.map((r) => [...r, ...Array(width - r.length).fill("")]);
  const range = encodeURIComponent(sheetRange(sheetTitle, "A1"));
  await sheetsFetch(
    token,
    `${API}/${created.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    { method: "PUT", body: JSON.stringify({ values: padded }) }
  );
  return { spreadsheetId: created.spreadsheetId, url: created.spreadsheetUrl };
}

export function parseSpreadsheetUrl(url: string): { spreadsheetId: string; gid?: number } | null {
  const id = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  if (!id) return null;
  const gid = url.match(/[#&?]gid=(\d+)/)?.[1];
  return gid === undefined ? { spreadsheetId: id } : { spreadsheetId: id, gid: Number(gid) };
}
