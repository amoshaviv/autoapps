import { describe, expect, it } from "vitest";
import { fixtures } from "./fixtures/sheets";
import { AppSpec } from "@/lib/apps/spec";
import {
  applyFilters,
  assertAppendAllowed,
  assertPatchAllowed,
  buildRowValues,
  computeMetrics,
  diffRow,
  resolveIdentityRow,
  sheetFromValues,
  sortRows,
} from "@/lib/apps/runtime";

const sam = { email: "Sam@Acme.example", name: "Sam Rivera" };
const stranger = { email: "nobody@acme.example", name: "Nobody" };
const lee = { email: "lee@acme.example", name: "Lee Park" };

const budget = sheetFromValues(fixtures.budget.values, 3);
const rsvp = sheetFromValues(fixtures.rsvp.values, 1);
const headcount = sheetFromValues(fixtures.headcount.values, 1);

const budgetSpec = (fallback: "choose" | "deny" = "choose"): AppSpec => ({
  version: 1,
  title: "Budget line",
  source: { type: "google_sheets", sheetTitle: "Budget", headerRow: 3, keyColumn: "Cost Center" },
  columns: [
    { header: "Cost Center", type: "text", readOnly: true },
    { header: "Owner Email", type: "email", readOnly: true },
    { header: "Q1", type: "currency" },
    { header: "Justification", type: "longtext", required: true },
    { header: "Status", type: "select", options: ["Not started", "Submitted", "Approved"] },
  ],
  identity: { matchColumn: "Owner Email", matchBy: "email", fallback },
  views: [
    { type: "my-row", title: "Mine", show: ["Cost Center", "Q1", "Justification"], editable: ["Q1", "Justification"] },
    { type: "stats", title: "Totals", metrics: [
      { label: "Lines", column: "Cost Center", agg: "count" },
      { label: "Q1 total", column: "Q1", agg: "sum" },
      { label: "Q1 filled", column: "Q1", agg: "count_filled" },
      { label: "Submitted", column: "Status", agg: "count", filter: [{ column: "Status", op: "eq", value: "submitted" }] },
    ] },
  ],
  access: { audience: "organization" },
});

const headcountSpec: AppSpec = {
  version: 1,
  title: "My hires",
  source: { type: "google_sheets", sheetTitle: "Headcount", headerRow: 1 },
  columns: [
    { header: "Employee", type: "text", readOnly: true },
    { header: "Manager Email", type: "email", readOnly: true },
    { header: "Start Date", type: "date", readOnly: true },
    { header: "Onboarding Complete", type: "checkbox" },
  ],
  views: [
    {
      type: "table",
      title: "My hires",
      columns: ["Employee", "Start Date", "Onboarding Complete"],
      filter: [{ column: "Manager Email", op: "eq", value: "$user.email" }],
      sort: { column: "Start Date", direction: "asc" },
      editable: ["Onboarding Complete"],
    },
  ],
  access: { audience: "organization" },
};

const rsvpSpec: AppSpec = {
  version: 1,
  title: "RSVP",
  source: { type: "google_sheets", sheetTitle: "Form Responses 1", headerRow: 1 },
  columns: [
    { header: "Name", type: "text", required: true },
    { header: "Email", type: "email" },
    { header: "Attending?", type: "checkbox" },
  ],
  identity: { matchColumn: "Email", matchBy: "email", fallback: "deny" },
  views: [{ type: "form", title: "RSVP", fields: ["Name", "Attending?"] }],
  access: { audience: "organization" },
};

describe("sheetFromValues", () => {
  it("applies the header row and keeps sheet row numbers", () => {
    expect(budget.headers[0]).toBe("Cost Center");
    expect(budget.rows[0]).toMatchObject({ rowNumber: 4, values: { "Cost Center": "Marketing", "Owner Email": "sam@acme.example" } });
    expect(budget.rows).toHaveLength(15);
  });
});

describe("identity", () => {
  it("matches the signed-in user's email case-insensitively", () => {
    expect(resolveIdentityRow(budgetSpec(), budget.rows, sam, budget.headers).row?.values["Cost Center"]).toBe("Marketing");
  });

  it("offers every row as a candidate when nothing matches and fallback is choose", () => {
    const result = resolveIdentityRow(budgetSpec("choose"), budget.rows, stranger, budget.headers);
    expect(result.row).toBeNull();
    expect(result.candidates).toHaveLength(15);
    expect(result.candidates?.[0]).toEqual({ rowNumber: 4, label: "Marketing" });
  });

  it("returns nothing when fallback is deny", () => {
    expect(resolveIdentityRow(budgetSpec("deny"), budget.rows, stranger, budget.headers)).toEqual({ row: null });
  });

  it("lets someone who owns several rows pick among their own", () => {
    const rows = [...budget.rows, { rowNumber: 99, values: { "Cost Center": "Extra", "Owner Email": "sam@acme.example" } }];
    const result = resolveIdentityRow(budgetSpec(), rows, sam, budget.headers);
    expect(result.candidates?.map((c) => c.label)).toEqual(["Marketing", "Extra"]);
  });
});

describe("filters, sort and metrics", () => {
  it("substitutes $user.email in filters", () => {
    const view = headcountSpec.views[0];
    if (view.type !== "table") throw new Error("expected a table view");
    const mine = applyFilters(headcount.rows, view.filter, lee);
    expect(mine.map((r) => r.values["Employee"])).toContain("Nora Quinn");
    expect(mine.every((r) => r.values["Manager Email"] === "lee@acme.example")).toBe(true);
    expect(mine).toHaveLength(6);
  });

  it("sorts dates chronologically", () => {
    const sorted = sortRows(headcount.rows, { column: "Start Date", direction: "asc" });
    expect(sorted[0].values["Start Date"]).toBe("Jan 12, 2026");
    expect(sorted[sorted.length - 1].values["Start Date"]).toBe("Sep 28, 2026");
  });

  it("sorts choice columns in option order, not alphabetically", () => {
    const tasks = sheetFromValues(fixtures.tasks.values, 1);
    const sorted = sortRows(tasks.rows, { column: "Priority", direction: "asc" }, [
      { header: "Priority", type: "select", options: ["High", "Medium", "Low"] },
    ]);
    const order = sorted.map((r) => r.values["Priority"]);
    expect(order.indexOf("Medium")).toBeGreaterThan(order.lastIndexOf("High"));
    expect(order.indexOf("Low")).toBeGreaterThan(order.lastIndexOf("Medium"));
  });

  it("computes metrics with filters", () => {
    const view = budgetSpec().views[1];
    if (view.type !== "stats") throw new Error("expected a stats view");
    expect(computeMetrics(budget.rows, view.metrics, sam)).toEqual([
      { label: "Lines", value: 15 },
      { label: "Q1 total", value: 307000 },
      { label: "Q1 filled", value: 3 },
      { label: "Submitted", value: 2 },
    ]);
  });
});

describe("assertPatchAllowed", () => {
  it("allows editable columns on the viewer's own row", () => {
    const row = assertPatchAllowed(budgetSpec(), 0, sam, 4, { Q1: "$100", Justification: "Growth" }, budget);
    expect(row.values["Cost Center"]).toBe("Marketing");
  });

  it("refuses columns that are not editable", () => {
    expect(() => assertPatchAllowed(budgetSpec(), 0, sam, 4, { "Cost Center": "Hacked" }, budget)).toThrow(/cannot be changed/);
    expect(() => assertPatchAllowed(budgetSpec(), 0, sam, 4, { "Owner Email": "me@evil.example" }, budget)).toThrow(/cannot be changed/);
  });

  it("refuses someone else's row", () => {
    expect(() => assertPatchAllowed(budgetSpec(), 0, sam, 5, { Q1: "1" }, budget)).toThrow(/only change your own row/);
  });

  it("lets a viewer with no row pick any row when fallback is choose, but not when deny", () => {
    expect(assertPatchAllowed(budgetSpec("choose"), 0, stranger, 5, { Q1: "1", Justification: "x" }, budget).rowNumber).toBe(5);
    expect(() => assertPatchAllowed(budgetSpec("deny"), 0, stranger, 5, { Q1: "1" }, budget)).toThrow(/only change your own row/);
  });

  it("enforces required columns", () => {
    expect(() => assertPatchAllowed(budgetSpec(), 0, sam, 4, { Justification: "  " }, budget)).toThrow(/required/);
  });

  it("refuses writes through read-only views", () => {
    expect(() => assertPatchAllowed(budgetSpec(), 1, sam, 4, { Q1: "1" }, budget)).toThrow(/does not allow changes/);
  });

  it("allows table edits only on rows inside the view's filter", () => {
    const leesRow = headcount.rows.find((r) => r.values["Manager Email"] === "lee@acme.example")!;
    const otherRow = headcount.rows.find((r) => r.values["Manager Email"] !== "lee@acme.example")!;
    expect(assertPatchAllowed(headcountSpec, 0, lee, leesRow.rowNumber, { "Onboarding Complete": "TRUE" }, headcount)).toBe(leesRow);
    expect(() => assertPatchAllowed(headcountSpec, 0, lee, otherRow.rowNumber, { "Onboarding Complete": "TRUE" }, headcount)).toThrow(/not in your view/);
    expect(() => assertPatchAllowed(headcountSpec, 0, lee, leesRow.rowNumber, { Employee: "x" }, headcount)).toThrow(/cannot be changed/);
  });

  it("404s a row that does not exist", () => {
    expect(() => assertPatchAllowed(budgetSpec(), 0, sam, 999, { Q1: "1" }, budget)).toThrow(/Row not found/);
  });
});

describe("appending", () => {
  it("fills the identity column with the viewer's email and builds a full-width row", () => {
    const values = assertAppendAllowed(rsvpSpec, 0, { Name: "Sam Rivera", "Attending?": "TRUE" }, sam);
    expect(values.Email).toBe("Sam@Acme.example");
    expect(buildRowValues(rsvpSpec, rsvp.headers, values, sam)).toEqual(["", "Sam Rivera", "Sam@Acme.example", "TRUE", "", ""]);
  });

  it("refuses fields outside the form, including a spoofed identity column", () => {
    expect(() => assertAppendAllowed(rsvpSpec, 0, { Name: "x", Email: "someone@else.example" }, sam)).toThrow(/not a field/);
  });

  it("requires required fields", () => {
    expect(() => assertAppendAllowed(rsvpSpec, 0, { "Attending?": "TRUE" }, sam)).toThrow(/required/);
  });

  it("refuses non-form views", () => {
    expect(() => assertAppendAllowed(budgetSpec(), 0, { Q1: "1" }, sam)).toThrow(/does not add rows/);
  });
});

describe("diffRow", () => {
  it("lists only changed cells", () => {
    expect(diffRow({ Q1: "", Q2: "5" }, { Q1: "10", Q2: "5" })).toEqual({ Q1: { from: "", to: "10" } });
  });
});
