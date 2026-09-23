// node --env-file=.env --import tsx scripts/try-sheets.ts [email]
// P1-3 check: creates "AutoApps scratch", reads it back, writes and clears a cell.
import { getDBModels, getDBConnection } from "../lib/sequelize";
import { getAccessTokenForUser } from "../lib/google/oauth";
import { appendRow, createSpreadsheet, getSpreadsheet, getValues, updateCells } from "../lib/google/sheets";

async function main() {
  const email = process.argv[2] ?? process.env.DEMO_BUILDER_EMAIL!;
  const { User } = await getDBModels();
  const user = await User.findByEmail(email);
  if (!user) throw new Error(`No user ${email}`);
  const token = await getAccessTokenForUser(user);

  const { spreadsheetId, url } = await createSpreadsheet(token, "AutoApps scratch", "Scratch Tab", [
    ["Name", "Email", "Note"],
    ["Ada", "ada@example.com", ""],
    ["Linus", "linus@example.com", "hello"],
  ]);
  console.log("created", url);

  const info = await getSpreadsheet(token, spreadsheetId);
  console.log("spreadsheet", JSON.stringify(info));
  console.log("values", JSON.stringify(await getValues(token, spreadsheetId, "Scratch Tab")));

  await updateCells(token, spreadsheetId, "Scratch Tab", 2, [{ columnIndex: 2, value: "test" }]);
  console.log("after write", JSON.stringify(await getValues(token, spreadsheetId, "Scratch Tab")));

  const appended = await appendRow(token, spreadsheetId, "Scratch Tab", ["Grace", "grace@example.com", "appended"]);
  console.log("appended at row", appended, JSON.stringify(await getValues(token, spreadsheetId, "Scratch Tab")));

  await updateCells(token, spreadsheetId, "Scratch Tab", 2, [{ columnIndex: 2, value: "" }]);
  console.log("after clear", JSON.stringify(await getValues(token, spreadsheetId, "Scratch Tab")));
  console.log("URL", url);
  await (await getDBConnection()).close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
