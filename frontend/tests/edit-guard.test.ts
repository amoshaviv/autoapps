import { describe, expect, it } from "vitest";
import { droppedPersonFilters } from "@/lib/ai/generate";
import { AppSpec } from "@/lib/apps/spec";

const base: AppSpec = {
  version: 1,
  title: "Tasks",
  source: { type: "google_sheets", sheetTitle: "Tasks", headerRow: 1 },
  columns: [
    { header: "Task", type: "text" },
    { header: "Assignee", type: "text" },
  ],
  views: [
    { type: "table", title: "All", columns: ["Task", "Assignee"] },
    {
      type: "table",
      title: "Mine",
      columns: ["Task"],
      filter: [{ column: "Assignee", op: "eq", value: "$user.name" }],
    },
  ],
  access: { audience: "organization" },
};

const withoutFilter = (): AppSpec => ({
  ...base,
  views: [base.views[0], { type: "table", title: "Mine", columns: ["Task"] }],
});

describe("droppedPersonFilters", () => {
  it("flags an edit that drops a $user filter the builder did not ask about", () => {
    const errors = droppedPersonFilters(base, withoutFilter(), "Remove the Notes column");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("View 'Mine' lost its filter Assignee eq $user.name");
  });

  it("allows it when the builder talks about who sees which rows", () => {
    expect(droppedPersonFilters(base, withoutFilter(), "Let everyone see all tasks in Mine")).toEqual([]);
    expect(droppedPersonFilters(base, withoutFilter(), "remove the filter")).toEqual([]);
  });

  it("accepts edits that keep the filter, and matches views by title when they move", () => {
    const moved: AppSpec = { ...base, views: [base.views[1], base.views[0]] };
    expect(droppedPersonFilters(base, moved, "Swap the tabs")).toEqual([]);
  });
});
