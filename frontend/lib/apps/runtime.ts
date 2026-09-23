// Runtime resolution (PLAN P3-1). Everything a published app may read or write
// is decided here from the stored AppSpec; the client is never trusted.
import { HttpError } from "@/lib/http-error";
import { AppSpec, Filter, Metric, View } from "./spec";
import { parseDate, parseNumber, resolveHeaderNames } from "@/lib/google/schema";

export interface Viewer {
  email: string;
  name: string;
}
export interface SheetRow {
  rowNumber: number; // 1-based row in the sheet
  values: Record<string, string>;
}
export interface LoadedSheet {
  headers: string[];
  rows: SheetRow[];
}

const norm = (v: string | undefined) => (v ?? "").trim().toLowerCase();

// Applies the spec's header row to raw sheet values (from getValues)
export function sheetFromValues(values: string[][], headerRow: number): LoadedSheet {
  const width = Math.max(0, ...values.map((r) => r.length));
  const headers = resolveHeaderNames(values[headerRow - 1] ?? [], width);
  const rows: SheetRow[] = [];
  for (let i = headerRow; i < values.length; i++) {
    const raw = values[i] ?? [];
    if (raw.every((c) => (c ?? "").toString().trim() === "")) continue;
    rows.push({
      rowNumber: i + 1,
      values: Object.fromEntries(headers.map((h, c) => [h, (raw[c] ?? "").toString().trim()])),
    });
  }
  return { headers, rows };
}

// Reads the sheet with the connection owner's Google credentials (PRD §7)
export async function loadSheet(
  connection: { spreadsheetId: string; ownerUserId: string },
  spec: AppSpec
): Promise<LoadedSheet> {
  const [{ getDBModels }, { getAccessTokenForUser }, { getValues }] = await Promise.all([
    import("@/lib/sequelize"),
    import("@/lib/google/oauth"),
    import("@/lib/google/sheets"),
  ]);
  const { User } = await getDBModels();
  const owner = await User.findByPk(connection.ownerUserId);
  if (!owner) throw new HttpError(409, "The app's sheet owner no longer exists", "owner_missing");
  const token = await getAccessTokenForUser(owner).catch((err) => {
    // Consumers cannot fix the owner's Google connection; say so plainly
    if (err instanceof HttpError && err.status === 428) {
      throw new HttpError(503, "The app's owner needs to reconnect Google Sheets", "owner_not_connected");
    }
    throw err;
  });
  const values = await getValues(token, connection.spreadsheetId, spec.source.sheetTitle);
  return sheetFromValues(values, spec.source.headerRow);
}

// ---- identity ------------------------------------------------------------

export function matchesViewer(spec: AppSpec, row: SheetRow, viewer: Viewer): boolean {
  if (!spec.identity) return false;
  const cell = norm(row.values[spec.identity.matchColumn]);
  const mine = spec.identity.matchBy === "email" ? norm(viewer.email) : norm(viewer.name);
  return cell !== "" && cell === mine;
}

export function rowLabel(spec: AppSpec, row: SheetRow, headers: string[]): string {
  const key = spec.source.keyColumn ?? headers[0];
  return row.values[key] || `Row ${row.rowNumber}`;
}

export function resolveIdentityRow(
  spec: AppSpec,
  rows: SheetRow[],
  viewer: Viewer,
  headers: string[] = Object.keys(rows[0]?.values ?? {})
): { row: SheetRow | null; candidates?: { rowNumber: number; label: string }[] } {
  const mine = rows.filter((r) => matchesViewer(spec, r, viewer));
  const toCandidates = (list: SheetRow[]) =>
    list.map((r) => ({ rowNumber: r.rowNumber, label: rowLabel(spec, r, headers) }));

  if (mine.length === 1) return { row: mine[0] };
  // Someone who owns several rows (e.g. two cost centers) picks among their own
  if (mine.length > 1) return { row: mine[0], candidates: toCandidates(mine) };
  if (spec.identity?.fallback === "choose") return { row: null, candidates: toCandidates(rows) };
  return { row: null };
}

// ---- filters, sort, metrics -------------------------------------------------

function substitute(value: string | undefined, viewer: Viewer) {
  if (value === "$user.email") return viewer.email;
  if (value === "$user.name") return viewer.name;
  return value ?? "";
}

function compare(a: string, b: string): number {
  const na = parseNumber(a);
  const nb = parseNumber(b);
  if (na !== null && nb !== null) return na - nb;
  const da = parseDate(a);
  const db = parseDate(b);
  if (da !== null && db !== null) return da - db;
  return a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
}

export function rowPasses(row: SheetRow, filters: Filter[] | undefined, viewer: Viewer): boolean {
  return (filters ?? []).every((f) => {
    const cell = (row.values[f.column] ?? "").trim();
    const value = substitute(f.value, viewer).trim();
    switch (f.op) {
      case "eq":
        return norm(cell) === norm(value);
      case "neq":
        return norm(cell) !== norm(value);
      case "contains":
        return norm(cell).includes(norm(value));
      case "gt":
        return cell !== "" && compare(cell, value) > 0;
      case "lt":
        return cell !== "" && compare(cell, value) < 0;
      case "empty":
        return cell === "";
      case "not_empty":
        return cell !== "";
    }
  });
}

export function applyFilters(rows: SheetRow[], filters: Filter[] | undefined, viewer: Viewer): SheetRow[] {
  return rows.filter((r) => rowPasses(r, filters, viewer));
}

// Empty cells sort last in both directions
export function sortRows(
  rows: SheetRow[],
  sort: { column: string; direction: "asc" | "desc" } | undefined
): SheetRow[] {
  if (!sort) return rows;
  const factor = sort.direction === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const va = a.values[sort.column] ?? "";
    const vb = b.values[sort.column] ?? "";
    if (va === "" || vb === "") return va === vb ? 0 : va === "" ? 1 : -1;
    return compare(va, vb) * factor;
  });
}

export function computeMetrics(
  rows: SheetRow[],
  metrics: Metric[],
  viewer: Viewer
): { label: string; value: number }[] {
  return metrics.map((m) => {
    const scoped = applyFilters(rows, m.filter, viewer);
    const cells = scoped.map((r) => (r.values[m.column] ?? "").trim());
    const numbers = cells.map(parseNumber).filter((n): n is number => n !== null);
    const round = (n: number) => Math.round(n * 100) / 100;
    switch (m.agg) {
      case "count":
        return { label: m.label, value: scoped.length };
      case "count_filled":
        return { label: m.label, value: cells.filter((c) => c !== "").length };
      case "count_empty":
        return { label: m.label, value: cells.filter((c) => c === "").length };
      case "sum":
        return { label: m.label, value: round(numbers.reduce((a, b) => a + b, 0)) };
      case "avg":
        return { label: m.label, value: numbers.length ? round(numbers.reduce((a, b) => a + b, 0) / numbers.length) : 0 };
    }
  });
}

// ---- reads: only the columns a view shows ----------------------------------

export function viewColumns(view: View): string[] {
  switch (view.type) {
    case "my-row":
      return view.show;
    case "form":
      return view.fields;
    case "table":
      return view.columns;
    case "stats":
      return [];
  }
}

export function projectRow(row: SheetRow, columns: string[]): SheetRow {
  return {
    rowNumber: row.rowNumber,
    values: Object.fromEntries(columns.map((c) => [c, row.values[c] ?? ""])),
  };
}

// ---- writes ------------------------------------------------------------------

export function getView(spec: AppSpec, viewIndex: number): View {
  const view = spec.views[viewIndex];
  if (!view) throw new HttpError(404, "View not found", "view_not_found");
  return view;
}

function checkWritableColumns(
  spec: AppSpec,
  allowed: string[],
  values: Record<string, string>
) {
  const keys = Object.keys(values);
  if (keys.length === 0) throw new HttpError(400, "Nothing to save", "no_values");
  for (const key of keys) {
    const column = spec.columns.find((c) => c.header === key);
    if (!allowed.includes(key) || !column || column.readOnly) {
      throw new HttpError(403, `'${key}' cannot be changed in this app`, "column_not_editable");
    }
    if (column.required && (values[key] ?? "").trim() === "") {
      throw new HttpError(400, `${column.label ?? key} is required`, "required");
    }
  }
}

// Returns the row being written. Throws 403 with a reason when not allowed.
export function assertPatchAllowed(
  spec: AppSpec,
  viewIndex: number,
  viewer: Viewer,
  rowNumber: number,
  values: Record<string, string>,
  sheet: LoadedSheet
): SheetRow {
  const view = getView(spec, viewIndex);
  const row = sheet.rows.find((r) => r.rowNumber === rowNumber);
  if (!row) throw new HttpError(404, "Row not found", "row_not_found");

  if (view.type === "my-row") {
    const { row: own, candidates } = resolveIdentityRow(spec, sheet.rows, viewer, sheet.headers);
    const allowedRows = own ? (candidates?.map((c) => c.rowNumber) ?? [own.rowNumber]) : [];
    // fallback "choose" lets someone with no row of their own pick any row
    const mayChoose = !own && spec.identity?.fallback === "choose";
    if (!allowedRows.includes(rowNumber) && !mayChoose) {
      throw new HttpError(403, "You can only change your own row", "not_your_row");
    }
    checkWritableColumns(spec, view.editable, values);
    return row;
  }

  if (view.type === "table" && view.editable?.length) {
    if (!rowPasses(row, view.filter, viewer)) {
      throw new HttpError(403, "This row is not in your view", "row_not_in_view");
    }
    checkWritableColumns(spec, view.editable, values);
    return row;
  }

  throw new HttpError(403, "This view does not allow changes", "view_read_only");
}

// Returns the values to append (identity added by the server when matchBy is email)
export function assertAppendAllowed(
  spec: AppSpec,
  viewIndex: number,
  values: Record<string, string>,
  viewer?: Viewer
): Record<string, string> {
  const view = getView(spec, viewIndex);
  if (view.type !== "form") throw new HttpError(403, "This view does not add rows", "view_not_form");

  for (const key of Object.keys(values)) {
    const column = spec.columns.find((c) => c.header === key);
    if (!view.fields.includes(key) || !column || column.readOnly) {
      throw new HttpError(403, `'${key}' is not a field of this form`, "field_not_allowed");
    }
  }
  for (const field of view.fields) {
    const column = spec.columns.find((c) => c.header === field);
    if (column?.required && (values[field] ?? "").trim() === "") {
      throw new HttpError(400, `${column.label ?? field} is required`, "required");
    }
  }

  const result = { ...values };
  if (spec.identity?.matchBy === "email" && viewer) result[spec.identity.matchColumn] = viewer.email;
  return result;
}

// Full-width row for appendRow, in sheet column order
export function buildRowValues(
  spec: AppSpec,
  headers: string[],
  values: Record<string, string>,
  viewer: Viewer
): string[] {
  const withIdentity = { ...values };
  if (spec.identity?.matchBy === "email") withIdentity[spec.identity.matchColumn] = viewer.email;
  return headers.map((h) => withIdentity[h] ?? "");
}

export function diffRow(
  before: Record<string, string>,
  after: Record<string, string>
): Record<string, { from: string; to: string }> {
  const changes: Record<string, { from: string; to: string }> = {};
  for (const [key, to] of Object.entries(after)) {
    const from = before[key] ?? "";
    if (from !== to) changes[key] = { from, to };
  }
  return changes;
}
