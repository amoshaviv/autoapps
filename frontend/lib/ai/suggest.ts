// suggestApps (PRD §9): three ideas with three distinct archetypes, from the
// schema and shape hints only.
import { z } from "zod";
import { HttpError } from "@/lib/http-error";
import { ConnectionSchema } from "@/lib/google/schema";
import { analyzeShape, preferredIdentityColumns } from "@/lib/apps/shape";
import { callStructured, ChatMessage, MODEL_SUGGEST } from "./client";
import { describeSchema, SUGGEST_SYSTEM } from "./prompts";

export const IdeaSchema = z.object({
  title: z.string().min(1),
  pitch: z.string().min(1),
  archetype: z.enum(["my-row", "form", "table", "stats", "mixed"]),
  identityColumn: z.string().optional().describe("Only for the idea scoped to the signed-in person: exact header that identifies them"),
});
export type Idea = z.infer<typeof IdeaSchema>;

const OutputSchema = z.object({ ideas: z.array(IdeaSchema).length(3) });

function checkIdeas(ideas: Idea[], schema: ConnectionSchema): string[] {
  const errors: string[] = [];
  const archetypes = ideas.map((i) => i.archetype);
  if (new Set(archetypes).size !== archetypes.length) {
    errors.push(`The three ideas must use three different archetypes; got ${archetypes.join(", ")}.`);
  }
  const candidates = analyzeShape(schema).identityCandidates;
  const identity = preferredIdentityColumns(schema);
  if (identity.length > 0 && !ideas.some((i) => i.identityColumn && identity.includes(i.identityColumn))) {
    errors.push(
      `One idea must be scoped to the signed-in person with identityColumn set to one of: ${identity.map((n) => `'${n}'`).join(", ")}.`
    );
  }
  for (const idea of ideas) {
    if (idea.archetype === "my-row" && candidates.length === 0) {
      errors.push(`"${idea.title}" is my-row but the sheet has no column that identifies a person.`);
    }
    if (idea.identityColumn && !identity.includes(idea.identityColumn)) {
      errors.push(
        `"${idea.title}" uses identityColumn '${idea.identityColumn}'; people sign in by email, so scope it with ${identity.map((n) => `'${n}'`).join(" or ")} instead.`
      );
    }
  }
  return errors;
}

export async function suggestApps({
  connection,
  organizationName,
}: {
  connection: { title: string | null; schema: ConnectionSchema | null };
  organizationName: string;
}): Promise<Idea[]> {
  const schema = connection.schema;
  if (!schema) throw new HttpError(409, "The sheet has not been read yet", "no_schema");
  if (schema.headers.length === 0) {
    throw new HttpError(422, "This tab has no header row or data to build on", "empty_sheet");
  }

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: `Organization: ${organizationName}\n\n${describeSchema({ title: connection.title, schema })}\n\nSuggest three apps.`,
    },
  ];

  let errors: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const { data } = await callStructured({
      model: MODEL_SUGGEST,
      system: SUGGEST_SYSTEM,
      messages,
      schema: OutputSchema,
      schemaName: "app_ideas",
      reasoningEffort: "low",
    });
    errors = checkIdeas(data.ideas, schema);
    if (errors.length === 0) return data.ideas;

    console.warn(`[ai] suggestions attempt ${attempt} rejected:\n- ${errors.join("\n- ")}`);
    messages.push(
      { role: "assistant", content: JSON.stringify(data) },
      { role: "user", content: `Fix these problems and return three ideas:\n- ${errors.join("\n- ")}` }
    );
  }
  throw new HttpError(502, `Suggestions were not usable: ${errors.join(" ")}`, "bad_suggestions");
}
