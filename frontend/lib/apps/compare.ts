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
