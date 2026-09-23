import { describe, expect, it } from "vitest";
import { fixtures } from "./fixtures/sheets";
import { extractSchema } from "@/lib/google/schema";
import { validateSpec } from "@/lib/apps/validate";
import { AppSpec } from "@/lib/apps/spec";

const budgetSchema = extractSchema(fixtures.budget.values, fixtures.budget.sheetTitle);

// The hero app: each owner fills their own budget line, plus a stats view.
const validSpec = (): AppSpec => ({
  version: 1,
  title: "Budget line self-service",
  description: "Fill in your cost center's FY2027 budget.",
  icon: "💰",
  source: { type: "google_sheets", sheetTitle: "Budget", headerRow: 3, keyColumn: "Cost Center" },
  columns: [
    { header: "Cost Center", type: "text", readOnly: true },
    { header: "Owner Email", type: "email", readOnly: true },
    { header: "FY2026 Actual", label: "Last year", type: "currency", readOnly: true },
    { header: "Q1", type: "currency", required: true },
    { header: "Q2", type: "currency", required: true },
    { header: "Justification", type: "longtext", help: "Why this amount?" },
    { header: "Status", type: "select", options: ["Not started", "Submitted", "Approved"] },
  ],
  identity: { matchColumn: "Owner Email", matchBy: "email", fallback: "choose" },
  views: [
    {
      type: "my-row",
      title: "Your budget line",
      show: ["Cost Center", "FY2026 Actual", "Q1", "Q2", "Justification"],
      editable: ["Q1", "Q2", "Justification"],
    },
    {
      type: "stats",
      title: "Progress",
      metrics: [
        { label: "Lines submitted", column: "Status", agg: "count", filter: [{ column: "Status", op: "eq", value: "Submitted" }] },
        { label: "Q1 total", column: "Q1", agg: "sum" },
      ],
    },
  ],
  access: { audience: "organization" },
});

const errorsFor = (mutate: (spec: AppSpec) => void) => {
  const spec = validSpec();
  mutate(spec);
  const result = validateSpec(spec, budgetSchema);
  if (result.ok) throw new Error("expected validation to fail");
  return result.errors.join("\n");
};

describe("validateSpec", () => {
  it("accepts a valid spec", () => {
    const result = validateSpec(validSpec(), budgetSchema);
    expect(result).toEqual({ ok: true, spec: validSpec() });
  });

  it("rejects a spec that does not match the zod schema", () => {
    expect(errorsFor((s) => ((s as { version: number }).version = 2))).toMatch(/^version:/);
    expect(errorsFor((s) => ((s.views[0] as { type: string }).type = "kanban"))).toMatch(/views\.0/);
  });

  it("rejects a header that does not exist, listing the available ones", () => {
    const errors = errorsFor((s) => {
      s.columns[1].header = "Ownr Email";
      s.identity!.matchColumn = "Ownr Email";
    });
    expect(errors).toContain("columns references column 'Ownr Email' which does not exist. Available: 'Cost Center', 'Owner Email'");
    expect(errors).toContain("identity.matchColumn references column 'Ownr Email'");
  });

  it("rejects unknown headers in every place a view can reference one", () => {
    const errors = errorsFor((s) => {
      s.source.keyColumn = "Nope";
      s.views.push({
        type: "table",
        title: "All lines",
        columns: ["Cost Center", "Nope1"],
        filter: [{ column: "Nope2", op: "not_empty" }],
        sort: { column: "Nope3", direction: "asc" },
      });
    });
    for (const header of ["Nope", "Nope1", "Nope2", "Nope3"]) {
      expect(errors).toContain(`'${header}' which does not exist`);
    }
    expect(errors).toContain("View 3 (table) filter references column 'Nope2'");
  });

  it("rejects a view header that is not declared in columns", () => {
    expect(errorsFor((s) => (s.views[0] as { show: string[] }).show.push("Q3"))).toContain(
      "uses 'Q3', which is not listed in columns"
    );
  });

  it("rejects a tab or header row that differs from the connection", () => {
    expect(errorsFor((s) => (s.source.sheetTitle = "Sheet1"))).toContain("connected tab is 'Budget'");
    expect(errorsFor((s) => (s.source.headerRow = 1))).toContain("header row is 3");
  });

  it("requires identity for a my-row view", () => {
    expect(errorsFor((s) => delete s.identity)).toContain("View 1 (my-row) needs identity");
  });

  it("requires my-row editable columns to be shown", () => {
    expect(errorsFor((s) => (s.views[0] as { show: string[] }).show.splice(2, 1))).toContain(
      "editable column 'Q1' must also be in show"
    );
  });

  it("rejects readOnly columns in editable lists and form fields", () => {
    expect(errorsFor((s) => (s.views[0] as { editable: string[] }).editable.push("Cost Center"))).toContain(
      "'Cost Center' is readOnly and cannot be editable"
    );
    expect(
      errorsFor((s) =>
        s.views.push({ type: "table", title: "t", columns: ["Cost Center"], editable: ["Cost Center"] })
      )
    ).toContain("View 3 (table): column 'Cost Center' is readOnly and cannot be editable");
    expect(
      errorsFor((s) => s.views.push({ type: "form", title: "New line", fields: ["Cost Center", "Q1"] }))
    ).toContain("'Cost Center' is readOnly and cannot be a form field");
  });

  it("rejects the email identity column as a form field", () => {
    expect(
      errorsFor((s) => {
        s.columns[1].readOnly = false;
        s.views.push({ type: "form", title: "New line", fields: ["Owner Email", "Q1"] });
      })
    ).toContain("remove 'Owner Email' from fields");
  });

  it("allows at most 4 views and 40 columns", () => {
    expect(
      errorsFor((s) => {
        for (let i = 0; i < 3; i++) s.views.push({ type: "table", title: `t${i}`, columns: ["Q1"] });
      })
    ).toMatch(/^views:/);
    expect(
      errorsFor((s) => {
        for (let i = 0; i < 40; i++) s.columns.push({ header: "Q3", type: "currency" });
      })
    ).toMatch(/^columns:/);
  });

  it("rejects a column defined twice", () => {
    expect(errorsFor((s) => s.columns.push({ header: "Q1", type: "number" }))).toContain(
      "Column 'Q1' is defined more than once"
    );
  });
});
