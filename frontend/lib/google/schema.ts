// Deterministic schema extraction for any sheet (PRD §9 "Reading any sheet").
// Nothing here may assume specific column names.
import { columnLetter } from "./columns";

export type InferredType =
  | "text"
  | "longtext"
  | "number"
  | "currency"
  | "date"
  | "select"
  | "checkbox"
  | "email";

export interface SchemaHeader {
  name: string;
  index: number; // 0-based column index in the sheet
  inferredType: InferredType;
  samples: string[]; // up to 5 distinct non-empty values
  fillRatio: number; // non-empty / rowCount, 2 decimals
  distinctCount: number; // distinct non-empty values, capped at 1000
  options?: string[]; // select only: every distinct value
}

export interface ConnectionSchema {
  sheetTitle: string;
  headerRow: number; // 1-based
  headers: SchemaHeader[];
  sampleRows: string[][]; // first 5 non-empty data rows, one cell per header
  rowCount: number; // non-empty rows after the header row
}

const TYPE_SAMPLE_ROWS = 50;
const DISTINCT_CAP = 1000;

const cell = (row: string[] | undefined, i: number) => (row?.[i] ?? "").toString().trim();
const isEmptyRow = (row: string[] | undefined) => !row || row.every((v) => cell([v], 0) === "");

export function parseNumber(value: string): number | null {
  const cleaned = value
    .replace(/[$€£\s,]/g, "")
    .replace(/^\((.*)\)$/, "-$1")
    .replace(/%$/, "");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
  return Number(cleaned);
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const monthIndex = (name: string) => MONTHS.indexOf(name.slice(0, 3).toLowerCase());

// Returns epoch ms for the date formats Sheets commonly displays, else null.
export function parseDate(value: string): number | null {
  const v = value.trim();
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));

  m = v.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{2}|\d{4})(?: (\d{1,2}):(\d{2})(?::(\d{2}))?(?: ?([AP]M))?)?$/i);
  if (m) {
    let [month, day] = [+m[1], +m[2]];
    if (month > 12 && day <= 12) [month, day] = [day, month];
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const year = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    let hour = +(m[4] ?? 0);
    if (m[7]?.toUpperCase() === "PM" && hour < 12) hour += 12;
    if (m[7]?.toUpperCase() === "AM" && hour === 12) hour = 0;
    return Date.UTC(year, month - 1, day, hour, +(m[5] ?? 0), +(m[6] ?? 0));
  }

  m = v.match(/^([A-Za-z]{3,9})\.? (\d{1,2}),? (\d{4})$/);
  if (m && monthIndex(m[1]) >= 0) return Date.UTC(+m[3], monthIndex(m[1]), +m[2]);

  m = v.match(/^(\d{1,2}) ([A-Za-z]{3,9})\.?,? (\d{4})$/);
  if (m && monthIndex(m[2]) >= 0) return Date.UTC(+m[3], monthIndex(m[2]), +m[1]);

  return null;
}

// First row where >= 50% of cells are non-empty text and none is a number.
export function detectHeaderRow(values: string[][]): number {
  const width = Math.max(0, ...values.slice(0, 20).map((r) => r.length));
  for (let r = 0; r < Math.min(values.length, 20); r++) {
    const cells = Array.from({ length: width }, (_, i) => cell(values[r], i));
    const nonEmpty = cells.filter((c) => c !== "");
    if (nonEmpty.length === 0 || nonEmpty.length < width * 0.5) continue;
    if (nonEmpty.some((c) => parseNumber(c) !== null)) continue;
    return r + 1;
  }
  return 1;
}

const share = (values: string[], test: (v: string) => boolean) =>
  values.length === 0 ? 0 : values.filter(test).length / values.length;

function median(numbers: number[]) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function inferType(typeSample: string[], distinct: Set<string>, filledCount: number): InferredType {
  if (typeSample.length === 0) return "text";
  if (typeSample.every((v) => /^(true|false)$/i.test(v))) return "checkbox";
  if (share(typeSample, (v) => v.includes("@")) >= 0.8) return "email";
  if (share(typeSample, (v) => parseNumber(v) !== null) >= 0.8) {
    return typeSample.some((v) => /[$€£]/.test(v)) ? "currency" : "number";
  }
  if (share(typeSample, (v) => parseDate(v) !== null) >= 0.8) return "date";
  // ">= 10 rows" counts filled cells, so sparse free-text columns stay text
  if (distinct.size <= 8 && filledCount >= 10) return "select";
  return median(typeSample.map((v) => v.length)) > 60 ? "longtext" : "text";
}

// Header text as AppSpecs refer to it: trimmed, "Column C" for blanks,
// " (2)" for repeats. The runtime must resolve headers exactly the same way.
export function resolveHeaderNames(headerCells: string[], width: number): string[] {
  const seen = new Map<string, number>();
  return Array.from({ length: width }, (_, i) => {
    const name = cell(headerCells, i) || `Column ${columnLetter(i)}`;
    const count = (seen.get(name) ?? 0) + 1;
    seen.set(name, count);
    return count > 1 ? `${name} (${count})` : name;
  });
}

export function extractSchema(
  values: string[][],
  sheetTitle: string,
  headerRowOverride?: number
): ConnectionSchema {
  const headerRow = headerRowOverride ?? detectHeaderRow(values);
  const headerCells = values[headerRow - 1] ?? [];
  const dataRows = values.slice(headerRow).filter((r) => !isEmptyRow(r));
  const width = Math.max(headerCells.length, ...dataRows.map((r) => r.length), 0);

  // Drop trailing columns with neither a header nor any data
  let usedWidth = width;
  while (
    usedWidth > 0 &&
    cell(headerCells, usedWidth - 1) === "" &&
    dataRows.every((r) => cell(r, usedWidth - 1) === "")
  ) {
    usedWidth--;
  }

  const rowCount = dataRows.length;
  const headers: SchemaHeader[] = [];
  const names = resolveHeaderNames(headerCells, usedWidth);

  for (let i = 0; i < usedWidth; i++) {
    const name = names[i];

    const column = dataRows.map((r) => cell(r, i));
    const filled = column.filter((v) => v !== "");
    const distinct = new Set<string>();
    for (const v of filled) {
      if (distinct.size >= DISTINCT_CAP) break;
      distinct.add(v);
    }
    const typeSample = column.slice(0, TYPE_SAMPLE_ROWS).filter((v) => v !== "");
    const inferredType = inferType(typeSample, distinct, filled.length);

    headers.push({
      name,
      index: i,
      inferredType,
      samples: Array.from(distinct).slice(0, 5),
      fillRatio: rowCount === 0 ? 0 : Math.round((filled.length / rowCount) * 100) / 100,
      distinctCount: distinct.size,
      ...(inferredType === "select" ? { options: Array.from(distinct) } : {}),
    });
  }

  return {
    sheetTitle,
    headerRow,
    headers,
    sampleRows: dataRows.slice(0, 5).map((r) => headers.map((h) => cell(r, h.index))),
    rowCount,
  };
}
