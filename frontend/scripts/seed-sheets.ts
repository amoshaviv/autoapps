// npm run seed:sheets [builderEmail] [consumerEmail]
// Creates the five fixture sheets (tests/fixtures/sheets.ts) in the builder's
// Drive. Where a sheet identifies people by email, the consumer's email goes
// into the first two data rows and the builder's into the third, so both
// accounts find "their" rows. Re-running creates new copies.
import { getDBModels, getDBConnection } from "../lib/sequelize";
import { getAccessTokenForUser } from "../lib/google/oauth";
import { createSpreadsheet } from "../lib/google/sheets";
import { extractSchema } from "../lib/google/schema";
import { analyzeShape } from "../lib/apps/shape";
import { HttpError } from "../lib/http-error";
import { fixtures } from "../tests/fixtures/sheets";

const clean = (value?: string) => value?.trim().split(/\s+/)[0] || undefined;

async function main() {
  const builderEmail = clean(process.argv[2]) ?? clean(process.env.DEMO_BUILDER_EMAIL);
  const consumerEmail = clean(process.argv[3]) ?? clean(process.env.DEMO_CONSUMER_EMAIL) ?? builderEmail;
  if (!builderEmail) throw new Error("Set DEMO_BUILDER_EMAIL or pass the builder email");

  const { User } = await getDBModels();
  const builder = await User.findByEmail(builderEmail);
  if (!builder) throw new Error(`${builderEmail} has not signed in to AutoApps yet`);

  let token: string;
  try {
    token = await getAccessTokenForUser(builder);
  } catch (err) {
    if (err instanceof HttpError && err.status === 428) {
      throw new Error(`${builderEmail} has not connected Google Sheets: visit /connect/google first`);
    }
    throw err;
  }

  console.log(`Builder ${builderEmail}, consumer ${consumerEmail}. Re-running creates new copies.\n`);

  for (const [name, fixture] of Object.entries(fixtures)) {
    const values = fixture.values.map((row) => [...row]);
    const schema = extractSchema(values, fixture.sheetTitle);
    const identity = analyzeShape(schema).identityCandidates
      .map((n) => schema.headers.find((h) => h.name === n)!)
      .find((h) => h.inferredType === "email");

    if (identity) {
      const firstDataRow = schema.headerRow; // 0-based index of the first row after the header
      const dataRows = values
        .map((row, i) => ({ row, i }))
        .filter(({ row, i }) => i >= firstDataRow && row.some((c) => c.trim() !== ""));
      dataRows[0].row[identity.index] = consumerEmail!;
      dataRows[1].row[identity.index] = consumerEmail!;
      dataRows[2].row[identity.index] = builderEmail;
    }

    const { url } = await createSpreadsheet(token, fixture.title, fixture.sheetTitle, values);
    console.log(`${name.padEnd(10)} ${url}${identity ? `  (emails in '${identity.name}')` : ""}`);
  }

  await (await getDBConnection()).close();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
