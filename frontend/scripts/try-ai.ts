// node --env-file=.env --import tsx scripts/try-ai.ts <connectionId | fixture:NAME> "<prompt>" ["<edit message>"]
// Generates a spec (and optionally edits it) and prints it with timing.
import { generateSpec, editSpec } from "../lib/ai/generate";
import { extractSchema } from "../lib/google/schema";
import { fixtures, FixtureName } from "../tests/fixtures/sheets";

async function loadConnection(ref: string) {
  if (ref.startsWith("fixture:")) {
    const fixture = fixtures[ref.slice("fixture:".length) as FixtureName];
    if (!fixture) throw new Error(`Unknown fixture ${ref}`);
    return { title: fixture.title, schema: extractSchema(fixture.values, fixture.sheetTitle), close: async () => {} };
  }
  const { getDBModels, getDBConnection } = await import("../lib/sequelize");
  const { Connection } = await getDBModels();
  const connection = await Connection.findByPk(ref);
  if (!connection) throw new Error(`No connection ${ref}`);
  return {
    title: connection.title,
    schema: connection.schema,
    close: async () => (await getDBConnection()).close(),
  };
}

async function main() {
  const [ref, prompt, editMessage] = process.argv.slice(2);
  if (!ref || !prompt) throw new Error('Usage: try-ai.ts <connectionId | fixture:NAME> "<prompt>" ["<edit>"]');
  const connection = await loadConnection(ref);

  let started = Date.now();
  const generated = await generateSpec({ connection, prompt, organizationName: "Acme" });
  console.log(`\n=== generated in ${Date.now() - started}ms: ${generated.summary}`);
  console.log(JSON.stringify(generated.spec, null, 2));

  if (editMessage) {
    started = Date.now();
    const edited = await editSpec({
      connection,
      currentSpec: generated.spec,
      history: [
        { role: "user", content: prompt },
        { role: "assistant", content: generated.summary },
      ],
      message: editMessage,
    });
    console.log(`\n=== edited in ${Date.now() - started}ms: ${edited.summary}`);
    console.log(JSON.stringify(edited.spec, null, 2));
  }
  await connection.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
