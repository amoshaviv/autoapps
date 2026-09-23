import { describe, expect, it } from "vitest";
import { fixtures, FixtureName } from "./fixtures/sheets";
import {
  ConnectionSchema,
  detectHeaderRow,
  extractSchema,
  parseDate,
  parseNumber,
} from "@/lib/google/schema";
import { columnLetter } from "@/lib/google/columns";
import { analyzeShape } from "@/lib/apps/shape";

const schemaOf = (name: FixtureName) =>
  extractSchema(fixtures[name].values, fixtures[name].sheetTitle);

const header = (schema: ConnectionSchema, name: string) => {
  const found = schema.headers.find((h) => h.name === name);
  if (!found) throw new Error(`No header ${name}`);
  return found;
};

const typesOf = (schema: ConnectionSchema, names: string[]) =>
  Object.fromEntries(names.map((n) => [n, header(schema, n).inferredType]));

describe("fixture sheets", () => {
  it("budget: header below a title row, identity by email, empty fill-in columns", () => {
    const s = schemaOf("budget");
    expect(s.headerRow).toBe(3);
    expect(s.rowCount).toBe(15);
    expect(typesOf(s, ["Owner Email", "FY2026 Actual", "Q1", "Status", "Justification"])).toEqual({
      "Owner Email": "email",
      "FY2026 Actual": "currency",
      Q1: "currency",
      Status: "select",
      Justification: "text",
    });
    expect(header(s, "Owner Email").fillRatio).toBe(1);
    expect(header(s, "Q1").fillRatio).toBe(0.2);
    expect(header(s, "Justification").fillRatio).toBe(0.13);

    const hints = analyzeShape(s);
    expect(hints.identityCandidates[0]).toBe("Owner Email");
    expect(hints.fillInCandidates).toEqual(["Q1", "Q2", "Q3", "Q4", "Justification"]);
    expect(hints.statusColumns).toEqual(["Status"]);
    expect(hints.keyCandidates).toContain("Cost Center");
    expect(hints.looksLikeLog).toBe(false);
  });

  it("tasks: identity by name, dates, select columns", () => {
    const s = schemaOf("tasks");
    expect(s.headerRow).toBe(1);
    expect(s.rowCount).toBe(22);
    expect(typesOf(s, ["Task", "Due Date", "Priority", "Status", "Notes"])).toEqual({
      Task: "text",
      "Due Date": "date",
      Priority: "select",
      Status: "select",
      Notes: "text",
    });
    expect(header(s, "Status").options).toEqual(
      expect.arrayContaining(["To do", "In progress", "Done", "Blocked"])
    );
    expect(header(s, "Assignee").fillRatio).toBe(1);
    expect(header(s, "Notes").fillRatio).toBe(0.23);

    const hints = analyzeShape(s);
    expect(hints.identityCandidates[0]).toBe("Assignee");
    expect(hints.statusColumns).toEqual(["Priority", "Status"]);
    expect(hints.dateColumns).toEqual(["Due Date"]);
    expect(hints.looksLikeLog).toBe(false);
  });

  it("inventory: no identity column, numeric, key column", () => {
    const s = schemaOf("inventory");
    expect(s.headerRow).toBe(1);
    expect(typesOf(s, ["SKU", "Quantity", "Reorder Level", "Category", "Last Counted"])).toEqual({
      SKU: "text",
      Quantity: "number",
      "Reorder Level": "number",
      Category: "select",
      "Last Counted": "date",
    });
    expect(header(s, "SKU").fillRatio).toBe(1);
    expect(header(s, "Quantity").fillRatio).toBe(1);

    const hints = analyzeShape(s);
    expect(hints.identityCandidates).toEqual([]);
    expect(hints.keyCandidates[0]).toBe("SKU");
    expect(hints.numericColumns).toEqual(["Quantity", "Reorder Level"]);
  });

  it("rsvp: log-like form responses with a checkbox", () => {
    const s = schemaOf("rsvp");
    expect(s.headerRow).toBe(1);
    expect(s.rowCount).toBe(14);
    expect(typesOf(s, ["Timestamp", "Email", "Attending?", "Plus one"])).toEqual({
      Timestamp: "date",
      Email: "email",
      "Attending?": "checkbox",
      "Plus one": "select",
    });
    expect(header(s, "Email").fillRatio).toBe(1);
    expect(header(s, "Dietary needs").fillRatio).toBe(0.29);

    const hints = analyzeShape(s);
    expect(hints.identityCandidates[0]).toBe("Email");
    expect(hints.looksLikeLog).toBe(true);
  });

  it("headcount: identity via manager email, checkbox", () => {
    const s = schemaOf("headcount");
    expect(s.headerRow).toBe(1);
    expect(typesOf(s, ["Manager Email", "Start Date", "Department", "Onboarding Complete"])).toEqual({
      "Manager Email": "email",
      "Start Date": "date",
      Department: "select",
      "Onboarding Complete": "checkbox",
    });
    expect(header(s, "Manager Email").distinctCount).toBe(4);
    expect(header(s, "Onboarding Complete").fillRatio).toBe(1);
    expect(header(s, "Employee").fillRatio).toBe(1);

    const hints = analyzeShape(s);
    expect(hints.identityCandidates[0]).toBe("Manager Email");
    expect(hints.looksLikeLog).toBe(false);
  });

  it("every fixture keeps five sample rows aligned with its headers", () => {
    for (const name of Object.keys(fixtures) as FixtureName[]) {
      const s = schemaOf(name);
      expect(s.sampleRows).toHaveLength(5);
      for (const row of s.sampleRows) expect(row).toHaveLength(s.headers.length);
    }
  });
});

describe("extractSchema edge cases", () => {
  it("names empty headers by column letter and de-duplicates repeated headers", () => {
    const s = extractSchema(
      [
        ["Name", "", "Name", "Score"],
        ["a", "x", "b", "1"],
      ],
      "Sheet1"
    );
    expect(s.headers.map((h) => h.name)).toEqual(["Name", "Column B", "Name (2)", "Score"]);
  });

  it("honours a header row override", () => {
    const s = extractSchema([["junk"], ["A", "B"], ["1", "2"]], "Sheet1", 2);
    expect(s.headerRow).toBe(2);
    expect(s.headers.map((h) => h.name)).toEqual(["A", "B"]);
    expect(s.rowCount).toBe(1);
  });

  it("falls back to row 1 when no row looks like a header", () => {
    expect(detectHeaderRow([["1", "2"], ["3", "4"]])).toBe(1);
  });

  it("treats an empty sheet as having no columns", () => {
    const s = extractSchema([], "Empty");
    expect(s.headers).toEqual([]);
    expect(s.rowCount).toBe(0);
  });
});

describe("parsers", () => {
  it("parses numbers as Sheets formats them", () => {
    expect(parseNumber("$1,250,000")).toBe(1250000);
    expect(parseNumber("(42.5)")).toBe(-42.5);
    expect(parseNumber("12%")).toBe(12);
    expect(parseNumber("SKU-1001")).toBeNull();
  });

  it("parses common date formats and rejects look-alikes", () => {
    expect(parseDate("2026-10-20")).toBe(Date.UTC(2026, 9, 20));
    expect(parseDate("9/1/2026 10:15:32")).toBe(Date.UTC(2026, 8, 1, 10, 15, 32));
    expect(parseDate("Mar 3, 2026")).toBe(Date.UTC(2026, 2, 3));
    expect(parseDate("3 March 2026")).toBe(Date.UTC(2026, 2, 3));
    expect(parseDate("Item 2")).toBeNull();
    expect(parseDate("Q1 2026")).toBeNull();
  });

  it("maps column indexes to letters", () => {
    expect(columnLetter(0)).toBe("A");
    expect(columnLetter(25)).toBe("Z");
    expect(columnLetter(26)).toBe("AA");
    expect(columnLetter(701)).toBe("ZZ");
  });
});
