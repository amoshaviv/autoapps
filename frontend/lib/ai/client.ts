// Nebius Token Factory through the OpenAI SDK (PRD §9). Always sets
// reasoning_effort, never temperature, and validates every answer with zod.
import OpenAI, { APIError } from "openai";
import { z } from "zod";
import { HttpError } from "@/lib/http-error";

export const MODEL = process.env.NEBIUS_MODEL ?? "zai-org/GLM-5.3";
export const MODEL_SUGGEST = process.env.NEBIUS_MODEL_SUGGEST ?? "zai-org/GLM-5.3-Flash";
export const REASONING_EFFORT = (process.env.NEBIUS_REASONING_EFFORT ?? "high") as ReasoningEffort;

export type ReasoningEffort = "none" | "low" | "medium" | "high";
export type ChatMessage = { role: "user" | "assistant"; content: string };

let client: OpenAI | null = null;
function getClient() {
  client ??= new OpenAI({
    baseURL: "https://api.tokenfactory.nebius.com/v1/",
    apiKey: process.env.NEBIUS_API_KEY,
  });
  return client;
}

function stripFence(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
}

export async function callStructured<T>(args: {
  model: string;
  system: string;
  messages: ChatMessage[];
  schema: z.ZodType<T>;
  schemaName: string;
  reasoningEffort: ReasoningEffort;
}): Promise<{ data: T; usage: unknown; ms: number; responseFormat: "json_schema" | "json_object" }> {
  const { $schema: _ignored, ...jsonSchema } = z.toJSONSchema(args.schema) as Record<string, unknown>;
  const messages = [
    {
      role: "system" as const,
      content: `${args.system}\n\nReturn only a JSON object matching this schema:\n${JSON.stringify(jsonSchema)}`,
    },
    ...args.messages,
  ];

  const request = (responseFormat: "json_schema" | "json_object") =>
    getClient().chat.completions.create({
      model: args.model,
      messages,
      response_format:
        responseFormat === "json_schema"
          ? { type: "json_schema", json_schema: { name: args.schemaName, schema: jsonSchema, strict: true } }
          : { type: "json_object" },
      reasoning_effort: args.reasoningEffort,
      max_completion_tokens: 24000,
    });

  const started = Date.now();
  let responseFormat: "json_schema" | "json_object" = "json_schema";
  let completion;
  try {
    completion = await request(responseFormat);
  } catch (err) {
    if (err instanceof APIError && err.status === 400 && /response_format|json_schema/i.test(err.message)) {
      console.warn(`[ai] ${args.model} rejected json_schema, retrying with json_object: ${err.message}`);
      responseFormat = "json_object";
      completion = await request(responseFormat);
    } else if (err instanceof APIError) {
      throw new HttpError(502, `Model request failed: ${err.message}`, "model_error");
    } else {
      throw err;
    }
  }
  const ms = Date.now() - started;

  const usage = completion.usage;
  console.log(
    `[ai] ${args.model} ${args.schemaName} ${responseFormat} ${ms}ms` +
      ` completion_tokens=${usage?.completion_tokens ?? "?"}` +
      ` reasoning_tokens=${usage?.completion_tokens_details?.reasoning_tokens ?? "?"}`
  );

  const choice = completion.choices[0];
  if (choice?.finish_reason === "length") throw new HttpError(502, "Model output was cut off");

  let json: unknown;
  try {
    json = JSON.parse(stripFence(choice?.message?.content ?? ""));
  } catch {
    throw new HttpError(502, "Model returned invalid JSON: not parseable");
  }

  const parsed = args.schema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new HttpError(502, `Model returned invalid JSON: ${issue.path.join(".")} ${issue.message}`);
  }

  return { data: parsed.data, usage, ms, responseFormat };
}
