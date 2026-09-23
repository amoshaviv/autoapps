// Shape hints derived from a ConnectionSchema (PRD §9 "Reading any sheet").
// Pure function: the only inputs are the extracted schema and, for
// looksLikeLog, the sample rows. Nothing may assume specific column names.
import { ConnectionSchema, SchemaHeader, parseDate } from "@/lib/google/schema";

export interface ShapeHints {
  identityCandidates: string[]; // email columns first, then name-like columns
  fillInCandidates: string[];
  statusColumns: string[];
  dateColumns: string[];
  numericColumns: string[];
  keyCandidates: string[];
  looksLikeLog: boolean;
  rowCount: number;
  emptyColumnCount: number;
}

const PERSON_WORDS = ["owner", "name", "assignee", "person", "employee", "manager", "requester"];
const STATUS_WORDS = ["status", "stage", "state", "phase", "priority"];

const headerHas = (h: SchemaHeader, words: string[]) =>
  words.some((w) => h.name.toLowerCase().includes(w));

// A date column whose sample values never go backwards, e.g. a form's
// "submitted at" column. Uses sampleRows, which hold the first rows in order.
function isAscendingDateColumn(schema: ConnectionSchema, header: SchemaHeader) {
  const position = schema.headers.indexOf(header);
  const times = schema.sampleRows
    .map((row) => parseDate(row[position] ?? ""))
    .filter((t): t is number => t !== null);
  if (times.length < 3) return false;
  return times.every((t, i) => i === 0 || t >= times[i - 1]);
}

// People sign in with their email, so email identity columns win over name columns
export function preferredIdentityColumns(schema: ConnectionSchema, hints = analyzeShape(schema)): string[] {
  const emails = hints.identityCandidates.filter(
    (name) => schema.headers.find((h) => h.name === name)?.inferredType === "email"
  );
  return emails.length > 0 ? emails : hints.identityCandidates;
}

export function analyzeShape(schema: ConnectionSchema): ShapeHints {
  const { headers, rowCount } = schema;

  const emailColumns = headers.filter((h) => h.inferredType === "email");
  const personColumns = headers.filter(
    (h) =>
      (h.inferredType === "text" || h.inferredType === "select") &&
      headerHas(h, PERSON_WORDS)
  );
  const identityCandidates = [...emailColumns, ...personColumns].map((h) => h.name);

  const keyCandidates = headers
    .filter(
      (h) =>
        rowCount >= 2 &&
        h.fillRatio >= 0.95 &&
        h.distinctCount >= Math.round(rowCount * h.fillRatio) &&
        !["currency", "checkbox", "longtext"].includes(h.inferredType)
    )
    .map((h) => h.name);

  const fillInCandidates = headers
    .filter(
      (h) =>
        h.fillRatio < 0.5 &&
        !identityCandidates.includes(h.name) &&
        !keyCandidates.includes(h.name)
    )
    .map((h) => h.name);

  const statusColumns = headers
    .filter((h) => h.inferredType === "select" && headerHas(h, STATUS_WORDS))
    .map((h) => h.name);

  const dateHeaders = headers.filter((h) => h.inferredType === "date");
  const numericColumns = headers
    .filter((h) => h.inferredType === "number" || h.inferredType === "currency")
    .map((h) => h.name);

  const looksLikeLog =
    rowCount >= 10 &&
    dateHeaders.some((h) => h.fillRatio >= 0.9 && isAscendingDateColumn(schema, h)) &&
    fillInCandidates.length <= headers.length / 3;

  return {
    identityCandidates,
    fillInCandidates,
    statusColumns,
    dateColumns: dateHeaders.map((h) => h.name),
    numericColumns,
    keyCandidates,
    looksLikeLog,
    rowCount,
    emptyColumnCount: headers.filter((h) => h.fillRatio === 0).length,
  };
}
