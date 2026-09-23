// npm run reset:demo -- <sheet URL> [email] [--dry-run]
// Clears the fill-in columns (mostly-empty columns, from analyzeShape) on every
// row whose email identity column matches `email` (default DEMO_CONSUMER_EMAIL),
// so the demo can be run again. No column names are assumed.
import { getDBModels, getDBConnection } from "../lib/sequelize";
import { getAccessTokenForUser } from "../lib/google/oauth";
import { getSpreadsheet, getValues, parseSpreadsheetUrl, updateCells } from "../lib/google/sheets";
import { extractSchema } from "../lib/google/schema";
import { analyzeShape, preferredIdentityColumns } from "../lib/apps/shape";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const [url, emailArg] = process.argv.slice(2).filter((a) => a !== "--dry-run");
  const email = (emailArg ?? process.env.DEMO_CONSUMER_EMAIL ?? "").trim().split(/\s+/)[0].toLowerCase();
  const ref = url ? parseSpreadsheetUrl(url) : null;
  if (!ref || !email) throw new Error("Usage: reset-demo.ts <Google Sheets URL> [email]");

  const { User } = await getDBModels();
  const builder = await User.findByEmail((process.env.DEMO_BUILDER_EMAIL ?? "").trim().split(/\s+/)[0]);
  if (!builder) throw new Error("Set DEMO_BUILDER_EMAIL to the account that owns the sheet");
  const token = await getAccessTokenForUser(builder);

  const info = await getSpreadsheet(token, ref.spreadsheetId);
  const tab = info.sheets.find((s) => s.sheetId === ref.gid) ?? info.sheets[0];
  const values = await getValues(token, ref.spreadsheetId, tab.title);
  const schema = extractSchema(values, tab.title);
  const hints = analyzeShape(schema);

  const identity = preferredIdentityColumns(schema, hints)
    .map((name) => schema.headers.find((h) => h.name === name)!)
    .find((h) => h.inferredType === "email");
  if (!identity) throw new Error(`No email column identifies people in '${tab.title}'`);
  const fillIn = schema.headers.filter((h) => hints.fillInCandidates.includes(h.name));
  if (fillIn.length === 0) throw new Error(`No fill-in columns found in '${tab.title}'`);

  let cleared = 0;
  for (let i = schema.headerRow; i < values.length; i++) {
    if ((values[i]?.[identity.index] ?? "").trim().toLowerCase() !== email) continue;
    const label = values[i]?.[schema.headers[0]?.index ?? 0] ?? "";
    if (!dryRun) {
      await updateCells(token, ref.spreadsheetId, tab.title, i + 1, fillIn.map((h) => ({ columnIndex: h.index, value: "" })));
    }
    console.log(`Row ${i + 1} (${label}): ${dryRun ? "would clear" : "cleared"} ${fillIn.map((h) => h.name).join(", ")}`);
    cleared++;
  }
  console.log(cleared ? `${dryRun ? "Dry run" : "Done"}: ${cleared} row(s) for ${email} in '${info.title}' / '${tab.title}'.` : `No rows for ${email}.`);
  await (await getDBConnection()).close();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
