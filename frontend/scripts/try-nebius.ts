// node --env-file=.env --import tsx scripts/try-nebius.ts [modelId] [reasoningEffort]
// Calls callStructured with a toy schema and prints data, usage and latency.
import { z } from "zod";
import { callStructured, ReasoningEffort } from "../lib/ai/client";

async function main() {
  const model = process.argv[2] ?? "zai-org/GLM-5.3";
  const reasoningEffort = (process.argv[3] ?? "low") as ReasoningEffort;
  const result = await callStructured({
    model,
    system: "You are a test endpoint.",
    messages: [{ role: "user", content: "Greet the AutoApps team and pick a number between 1 and 100." }],
    schema: z.object({ greeting: z.string(), number: z.number() }),
    schemaName: "toy",
    reasoningEffort,
  });
  console.log(JSON.stringify({ model, reasoningEffort, ...result }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
