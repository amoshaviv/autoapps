import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, HttpError, requireAppAccess } from "@/lib/auth/guards";
import { getDBModels } from "@/lib/sequelize";
import { appendRow } from "@/lib/google/sheets";
import {
  applyFilters,
  assertAppendAllowed,
  buildRowValues,
  computeMetrics,
  getOwnerToken,
  getView,
  loadSheet,
  projectRow,
  resolveIdentityRow,
  SheetRow,
  sortRows,
} from "@/lib/apps/runtime";

type Context = { params: Promise<{ shortId: string }> };

const viewIndexOf = (raw: string | null) => {
  const n = Number(raw ?? "0");
  if (!Number.isInteger(n) || n < 0) throw new HttpError(400, "Invalid view", "invalid_view");
  return n;
};

export const GET = handleRoute(async (request: NextRequest, context: Context) => {
  const { shortId } = await context.params;
  const params = request.nextUrl.searchParams;
  const { spec, viewer, connection } = await requireAppAccess(request, shortId, { draft: params.get("draft") === "1" });
  const view = getView(spec, viewIndexOf(params.get("view")));

  if (view.type === "form") return NextResponse.json({});

  const sheet = await loadSheet(connection!, spec);
  // The row's key value lets the client send expectedKey with a PATCH (PRD §7)
  const keyColumn = spec.source.keyColumn ?? spec.identity?.matchColumn;
  const withKey = (row: SheetRow, columns: string[]) => ({
    ...projectRow(row, columns),
    ...(keyColumn ? { key: row.values[keyColumn] ?? "" } : {}),
  });

  if (view.type === "my-row") {
    const { row, candidates } = resolveIdentityRow(spec, sheet.rows, viewer, sheet.headers);
    // ?row=N picks one of the allowed candidates (several own rows, or fallback "choose")
    const picked = params.get("row");
    let chosen = row;
    if (picked !== null) {
      const allowed = candidates?.some((c) => c.rowNumber === Number(picked));
      if (!allowed) throw new HttpError(403, "You can only open your own row", "not_your_row");
      chosen = sheet.rows.find((r) => r.rowNumber === Number(picked)) ?? null;
    }
    return NextResponse.json({
      row: chosen ? withKey(chosen, view.show) : null,
      ...(candidates ? { candidates } : {}),
    });
  }

  if (view.type === "table") {
    const rows = sortRows(applyFilters(sheet.rows, view.filter, viewer), view.sort, spec.columns);
    return NextResponse.json({ rows: rows.map((r) => withKey(r, view.columns)), total: rows.length });
  }

  return NextResponse.json({ metrics: computeMetrics(sheet.rows, view.metrics, viewer) });
});

const AppendBody = z.object({
  view: z.number().int().min(0),
  values: z.record(z.string(), z.string().max(50_000)),
});

export const POST = handleRoute(async (request: NextRequest, context: Context) => {
  const { shortId } = await context.params;
  const draft = request.nextUrl.searchParams.get("draft") === "1";
  const { app, user, spec, viewer, connection } = await requireAppAccess(request, shortId, { draft });

  const body = AppendBody.safeParse(await request.json().catch(() => null));
  if (!body.success) throw new HttpError(400, "Invalid request body", "invalid_body");

  const values = assertAppendAllowed(spec, body.data.view, body.data.values, viewer);
  const token = await getOwnerToken(connection!);
  const sheet = await loadSheet(connection!, spec, token);
  const missing = Object.keys(values).filter((h) => !sheet.headers.includes(h));
  if (missing.length) throw new HttpError(409, `The sheet no longer has: ${missing.join(", ")}`, "column_missing");

  const rowNumber = await appendRow(
    token,
    connection!.spreadsheetId,
    spec.source.sheetTitle,
    buildRowValues(spec, sheet.headers, values, viewer)
  );

  const { AppActivity } = await getDBModels();
  await AppActivity.record({
    app,
    user,
    action: "row_appended",
    rowNumber,
    changes: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, { from: "", to: v }])),
  });

  return NextResponse.json({ rowNumber }, { status: 201 });
});
