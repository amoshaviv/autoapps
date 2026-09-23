// generateSpec / editSpec (PRD §9): model call → validateSpec → one retry with
// the validation errors → 422 invalid_spec if it still fails.
import { z } from "zod";
import { HttpError } from "@/lib/http-error";
import { AppSpec, AppSpecSchema } from "@/lib/apps/spec";
import { validateSpec } from "@/lib/apps/validate";
import { ConnectionSchema } from "@/lib/google/schema";
import { callStructured, ChatMessage, MODEL, REASONING_EFFORT } from "./client";
import { describeSchema, EDIT_SYSTEM, GENERATE_SYSTEM } from "./prompts";
import type { Idea } from "./suggest";


type SpecConnection = { title: string | null; schema: ConnectionSchema | null };

const OutputSchema = z.object({
  spec: AppSpecSchema,
  summary: z.string().describe("One or two sentences to the builder"),
});

function requireSchema(connection: SpecConnection): ConnectionSchema {
  if (!connection.schema) throw new HttpError(409, "The sheet has not been read yet", "no_schema");
  return connection.schema;
}

async function callWithRetry(
  system: string,
  messages: ChatMessage[],
  schema: ConnectionSchema,
  extraCheck: (spec: AppSpec) => string[] = () => []
): Promise<{ spec: AppSpec; summary: string }> {
  const conversation = [...messages];
  let errors: string[] = [];

  for (let attempt = 1; attempt <= 2; attempt++) {
    let output: z.infer<typeof OutputSchema> | null = null;
    try {
      const result = await callStructured({
        model: MODEL,
        system,
        messages: conversation,
        schema: OutputSchema,
        schemaName: "app_spec",
        reasoningEffort: REASONING_EFFORT,
      });
      output = result.data;
    } catch (err) {
      // A structurally invalid answer gets the same retry as a failed validation
      if (!(err instanceof HttpError && err.message.startsWith("Model returned invalid JSON"))) throw err;
      errors = [err.message];
    }

    if (output) {
      const validation = validateSpec(output.spec, schema);
      errors = validation.ok ? extraCheck(validation.spec) : validation.errors;
      if (validation.ok && errors.length === 0) return { spec: validation.spec, summary: output.summary };
      conversation.push({ role: "assistant", content: JSON.stringify(output) });
    }

    console.warn(`[ai] spec attempt ${attempt} failed validation:\n- ${errors.join("\n- ")}`);
    conversation.push({
      role: "user",
      content: `The spec failed validation:\n- ${errors.join("\n- ")}\nFix these and return the full spec. The summary is for the builder: describe the change to their app, not these fixes.`,
    });
  }

  throw new HttpError(422, errors.join("\n"), "invalid_spec");
}

export async function generateSpec({
  connection,
  idea,
  prompt,
  organizationName,
}: {
  connection: SpecConnection;
  idea?: Idea;
  prompt?: string;
  organizationName: string;
}) {
  const schema = requireSchema(connection);
  if (!idea && !prompt) throw new HttpError(400, "Pick an idea or describe the app", "no_request");

  const request = idea
    ? `Build this app idea:\nTitle: ${idea.title}\nPitch: ${idea.pitch}\nArchetype: ${idea.archetype}` +
      (idea.identityColumn ? `\nIdentity column: "${idea.identityColumn}"` : "") +
      (prompt ? `\nThe builder adds: ${prompt}` : "")
    : `The builder asks for: ${prompt}`;

  return callWithRetry(
    GENERATE_SYSTEM,
    [
      {
        role: "user",
        content: `Organization: ${organizationName}\n\n${describeSchema({ title: connection.title, schema })}\n\n${request}`,
      },
    ],
    schema
  );
}

// Filters that scope rows to the signed-in person keep other people's rows
// private. An edit may only drop one when the builder asked about who sees what.
export function droppedPersonFilters(before: AppSpec, after: AppSpec, message: string): string[] {
  if (/filter|everyone|everybody|all rows|all the rows|show all|who (can )?see/i.test(message)) return [];
  const errors: string[] = [];
  before.views.forEach((view, i) => {
    if (view.type !== "table") return;
    const personal = (view.filter ?? []).filter((f) => f.value?.startsWith("$user."));
    if (personal.length === 0) return;
    const match = after.views.find((v) => v.title === view.title) ?? after.views[i];
    const kept = match?.type === "table" ? (match.filter ?? []) : [];
    for (const f of personal) {
      if (!kept.some((k) => k.column === f.column && k.op === f.op && k.value === f.value)) {
        errors.push(
          `View '${view.title}' lost its filter ${f.column} ${f.op} ${f.value}, which limits it to the signed-in person's rows. Keep that filter; the builder did not ask to change who sees which rows.`
        );
      }
    }
  });
  return errors;
}

export async function editSpec({
  connection,
  currentSpec,
  history,
  message,
}: {
  connection: SpecConnection;
  currentSpec: AppSpec;
  history: ChatMessage[];
  message: string;
}) {
  const schema = requireSchema(connection);
  // The current spec sits right next to the request, after the history, so the
  // model edits it instead of reconstructing the app from the conversation
  return callWithRetry(
    EDIT_SYSTEM,
    [
      { role: "user", content: describeSchema({ title: connection.title, schema }) },
      ...history.slice(-10),
      {
        role: "user",
        content: `## Current AppSpec (edit this)\n${JSON.stringify(currentSpec)}\n\n## Requested change\n${message}`,
      },
    ],
    schema,
    (spec) => droppedPersonFilters(currentSpec, spec, message)
  );
}
