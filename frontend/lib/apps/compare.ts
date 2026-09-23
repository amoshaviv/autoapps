// Number- and date-aware comparison of cell text; shared by server and client.
import { parseDate, parseNumber } from "@/lib/google/schema";

export function compareCells(a: string, b: string): number {
  const na = parseNumber(a);
  const nb = parseNumber(b);
  if (na !== null && nb !== null) return na - nb;
  const da = parseDate(a);
  const db = parseDate(b);
  if (da !== null && db !== null) return da - db;
  return a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
}

// Choice columns sort in the order of their options (High, Medium, Low), not
// alphabetically; values outside the options go after them.
export function compareByColumn(a: string, b: string, options?: string[]): number {
  if (options && options.length) {
    const rank = (v: string) => {
      const i = options.findIndex((o) => o.toLowerCase() === v.trim().toLowerCase());
      return i === -1 ? options.length : i;
    };
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
  }
  return compareCells(a, b);
}
