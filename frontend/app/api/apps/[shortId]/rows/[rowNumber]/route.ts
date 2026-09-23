import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, HttpError, requireAppAccess } from "@/lib/auth/guards";
import { getDBModels } from "@/lib/sequelize";
import { updateCells } from "@/lib/google/sheets";
import { assertPatchAllowed, diffRow, getOwnerToken, loadSheet } from "@/lib/apps/runtime";

type Context = { params: Promise<{ shortId: string; rowNumber: string }> };

const Body = z.object({
  view: z.number().int().min(0),
  values: z.record(z.string(), z.string().max(50_000)),
  expectedKey: z.string().optional(),
});

export const PATCH = handleRoute(async (request: NextRequest, context: Context) => {
  const { shortId, rowNumber: rawRow } = await context.params;
  const draft = request.nextUrl.searchParams.get("draft") === "1";
  const { app, user, spec, viewer, connection } = await requireAppAccess(request, shortId, { draft });

  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) throw new HttpError(400, "Invalid request body", "invalid_body");
  let rowNumber = Number(rawRow);
  if (!Number.isInteger(rowNumber) || rowNumber < 1) throw new HttpError(400, "Invalid row", "invalid_row");

  const token = await getOwnerToken(connection!);
  const sheet = await loadSheet(connection!, spec, token);

  // Rows can shift while the app is open: verify the key cell, re-locate by scan (PRD §7)
  const keyColumn = spec.source.keyColumn ?? spec.identity?.matchColumn;
  const { expectedKey } = body.data;
  if (keyColumn && expectedKey !== undefined) {
    const atRow = sheet.rows.find((r) => r.rowNumber === rowNumber);
    if (atRow?.values[keyColumn] !== expectedKey) {
      const moved = sheet.rows.find((r) => r.values[keyColumn] === expectedKey);
      if (!moved) throw new HttpError(409, "This row changed in the sheet. Reload and try again.", "row_moved");
      rowNumber = moved.rowNumber;
    }
  }

  const row = assertPatchAllowed(spec, body.data.view, viewer, rowNumber, body.data.values, sheet);
  const cells = Object.entries(body.data.values).map(([header, value]) => {
    const columnIndex = sheet.headers.indexOf(header);
    if (columnIndex < 0) throw new HttpError(409, `The sheet no longer has '${header}'`, "column_missing");
    return { columnIndex, value };
  });

  await updateCells(token, connection!.spreadsheetId, spec.source.sheetTitle, rowNumber, cells);

  const changes = diffRow(row.values, body.data.values);
  if (Object.keys(changes).length) {
    const { AppActivity } = await getDBModels();
    await AppActivity.record({ app, user, action: "row_updated", rowNumber, changes });
  }

  return NextResponse.json({ ok: true, rowNumber });
});
