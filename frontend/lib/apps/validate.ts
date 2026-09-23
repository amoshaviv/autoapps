// Server-side AppSpec validation (PRD §6). Messages are written for the model
// (retry prompt) and, on a second failure, for the builder.
import { AppSpec, AppSpecSchema, MAX_COLUMNS, MAX_VIEWS, View } from "./spec";
import { ConnectionSchema } from "@/lib/google/schema";

export type ValidationResult = { ok: true; spec: AppSpec } | { ok: false; errors: string[] };

// Every header a view reads or writes, with where it came from
function viewHeaders(view: View): { header: string; where: string }[] {
  switch (view.type) {
    case "my-row":
      return [
        ...view.show.map((header) => ({ header, where: "show" })),
        ...view.editable.map((header) => ({ header, where: "editable" })),
      ];
    case "form":
      return view.fields.map((header) => ({ header, where: "fields" }));
    case "table":
      return [
        ...view.columns.map((header) => ({ header, where: "columns" })),
        ...(view.editable ?? []).map((header) => ({ header, where: "editable" })),
        ...(view.filter ?? []).map((f) => ({ header: f.column, where: "filter" })),
        ...(view.sort ? [{ header: view.sort.column, where: "sort" }] : []),
      ];
    case "stats":
      return view.metrics.flatMap((m) => [
        { header: m.column, where: `metric '${m.label}'` },
        ...(m.filter ?? []).map((f) => ({ header: f.column, where: `metric '${m.label}' filter` })),
      ]);
  }
}

const quoteList = (items: string[]) => items.map((i) => `'${i}'`).join(", ");

export function validateSpec(input: unknown, schema: ConnectionSchema): ValidationResult {
  const parsed = AppSpecSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "spec"}: ${issue.message}`
      ),
    };
  }
  const spec = parsed.data;
  const errors: string[] = [];
  const available = schema.headers.map((h) => h.name);
  const exists = (header: string) => available.includes(header);
  const missing = (header: string, where: string) =>
    errors.push(
      `${where} references column '${header}' which does not exist. Available: ${quoteList(available)}`
    );

  if (spec.source.sheetTitle !== schema.sheetTitle) {
    errors.push(
      `source.sheetTitle is '${spec.source.sheetTitle}' but the connected tab is '${schema.sheetTitle}'`
    );
  }
  if (spec.source.headerRow !== schema.headerRow) {
    errors.push(
      `source.headerRow is ${spec.source.headerRow} but the sheet's header row is ${schema.headerRow}`
    );
  }
  if (spec.views.length > MAX_VIEWS) errors.push(`At most ${MAX_VIEWS} views are allowed`);
  if (spec.columns.length > MAX_COLUMNS) errors.push(`At most ${MAX_COLUMNS} columns are allowed`);

  // Column definitions
  const declared = new Map(spec.columns.map((c) => [c.header, c]));
  const seen = new Set<string>();
  for (const column of spec.columns) {
    if (!exists(column.header)) missing(column.header, "columns");
    if (seen.has(column.header)) errors.push(`Column '${column.header}' is defined more than once`);
    seen.add(column.header);
  }

  if (spec.source.keyColumn && !exists(spec.source.keyColumn)) {
    missing(spec.source.keyColumn, "source.keyColumn");
  }
  if (spec.identity && !exists(spec.identity.matchColumn)) {
    missing(spec.identity.matchColumn, "identity.matchColumn");
  }

  const isReadOnly = (header: string) => declared.get(header)?.readOnly === true;

  spec.views.forEach((view, i) => {
    const name = `View ${i + 1} (${view.type})`;

    for (const { header, where } of viewHeaders(view)) {
      if (!exists(header)) missing(header, `${name} ${where}`);
      else if (!declared.has(header)) {
        errors.push(`${name} ${where} uses '${header}', which is not listed in columns. Add a column definition for it.`);
      }
    }

    if (view.type === "my-row") {
      if (!spec.identity) errors.push(`${name} needs identity (which column matches the signed-in user)`);
      for (const header of view.editable) {
        if (!view.show.includes(header)) errors.push(`${name}: editable column '${header}' must also be in show`);
        if (isReadOnly(header)) errors.push(`${name}: column '${header}' is readOnly and cannot be editable`);
      }
    }

    if (view.type === "table") {
      for (const header of view.editable ?? []) {
        if (isReadOnly(header)) errors.push(`${name}: column '${header}' is readOnly and cannot be editable`);
      }
    }

    if (view.type === "form") {
      for (const header of view.fields) {
        if (isReadOnly(header)) errors.push(`${name}: column '${header}' is readOnly and cannot be a form field`);
      }
      if (
        spec.identity?.matchBy === "email" &&
        view.fields.includes(spec.identity.matchColumn)
      ) {
        errors.push(
          `${name}: remove '${spec.identity.matchColumn}' from fields; the server fills it with the signed-in user's email`
        );
      }
    }
  });

  return errors.length ? { ok: false, errors } : { ok: true, spec };
}
