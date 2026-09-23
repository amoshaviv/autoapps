// Creates every table defined in lib/sequelize/models on the database at DB_URL.
// Never drops or alters: sync() only creates tables that do not exist yet.
//   npm run db:sync            (refuses when NODE_ENV=production)
//   npm run db:sync -- --yes   (allows production)
import { getDBConnection } from "../lib/sequelize";

async function main() {
  if (process.env.NODE_ENV === "production" && !process.argv.includes("--yes")) {
    console.error("NODE_ENV is production; pass --yes to sync anyway.");
    process.exit(1);
  }

  const db = await getDBConnection();
  await db.sync();

  const tables = await db.getQueryInterface().showAllTables();
  console.log("Tables:", [...tables].sort().join(", "));
  await db.close();
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
