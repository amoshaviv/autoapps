// Reads a spreadsheet tab into a connection's cached schema.
import { HttpError } from "@/lib/http-error";
import { getSpreadsheet, getValues } from "@/lib/google/sheets";
import { extractSchema } from "@/lib/google/schema";
import { IConnectionInstance } from "@/lib/sequelize/models/connection";

export async function readIntoConnection(
  token: string,
  connection: IConnectionInstance,
  options: { gid?: number; sheetTitle?: string; headerRow?: number } = {}
) {
  const info = await getSpreadsheet(token, connection.spreadsheetId);
  const tab =
    (options.sheetTitle !== undefined && info.sheets.find((s) => s.title === options.sheetTitle)) ||
    (options.gid !== undefined && info.sheets.find((s) => s.sheetId === options.gid)) ||
    (options.sheetTitle === undefined && options.gid === undefined && connection.schema
      ? info.sheets.find((s) => s.title === connection.schema!.sheetTitle)
      : undefined) ||
    info.sheets[0];
  if (!tab) throw new HttpError(422, "The spreadsheet has no tabs", "no_tabs");
  if (options.sheetTitle !== undefined && tab.title !== options.sheetTitle) {
    throw new HttpError(404, `No tab named '${options.sheetTitle}'`, "tab_not_found");
  }

  const values = await getValues(token, connection.spreadsheetId, tab.title);
  const schema = extractSchema(values, tab.title, options.headerRow);

  return connection.update({
    title: info.title,
    sheets: info.sheets,
    schema,
    schemaFetchedAt: new Date(),
  });
}
